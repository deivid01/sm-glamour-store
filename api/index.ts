import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import cron from 'node-cron';
import type { Request, Response } from 'express';

type AnyRecord = Record<string, unknown>;

type OlistSyncSummary = {
    fetched: number;
    upserted: number;
    skipped: number;
    pagesProcessed: number;
    startedAt: string;
    finishedAt: string;
};

type NormalizedOlistProduct = {
    id_olist: string;
    nome: string;
    slug: string;
    descricao: string;
    preco: string;
    estoque: number;
    codigo_barras: string | null;
    imagem_url: string | null;
    peso_kg: string;
    comprimento_cm: string;
    altura_cm: string;
    largura_cm: string;
    categoria_nome: string;
    categoria_slug: string;
    criado_em: Date;
    atualizado_em: Date;
};

const DEFAULT_CATEGORY_NAME = 'Sem categoria';
const DEFAULT_CATEGORY_SLUG = 'sem-categoria';
const OLIST_DEFAULT_BASE_URL = 'https://partners-api.olist.com/v1';
const OLIST_DEFAULT_PRODUCTS_PATH = '/seller-products/';

const firstNonEmptyEnv = (...keys: string[]): string => {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) return value;
    }
    return '';
};

const toId = (value: unknown): string => {
    if (typeof value === 'bigint') return value.toString();
    if (value === null || value === undefined) return '';
    return String(value);
};

const toSingleValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
};

const toNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') {
        const parsed = Number(value.replace(',', '.').replace(/[^\d.-]/g, ''));
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};

const toInt = (value: unknown, fallback = 0): number => Math.trunc(toNumber(value, fallback));

const toDate = (value: unknown, fallback = new Date()): Date => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return fallback;
};

const toDecimalString = (value: unknown, digits: number, fallback: number): string => {
    const safe = toNumber(value, fallback);
    return safe.toFixed(digits);
};

const sanitizePostalCode = (value: unknown): string => String(value ?? '').replace(/\D/g, '');

const toSlug = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const buildProductSlug = (name: string, idOlist: string, explicitSlug?: string): string => {
    const base = toSlug(explicitSlug?.trim() || name) || 'produto';
    const suffix = toSlug(idOlist) || 'id';
    const withSuffix = base.endsWith(`-${suffix}`) ? base : `${base}-${suffix}`;
    return withSuffix.slice(0, 255);
};

const pickFirst = (source: AnyRecord, keys: string[]): unknown => {
    for (const key of keys) {
        const value = source[key];
        if (value !== null && value !== undefined && value !== '') return value;
    }
    return undefined;
};

const pickString = (source: AnyRecord, keys: string[], fallback = ''): string => {
    const value = pickFirst(source, keys);
    if (typeof value === 'string') return value.trim() || fallback;
    if (typeof value === 'number' || typeof value === 'bigint') return String(value);
    return fallback;
};

const normalizeDatabaseUrl = (rawUrl: string): string => {
    try {
        const parsed = new URL(rawUrl);
        const isSupabasePooler = parsed.hostname.endsWith('pooler.supabase.com') || parsed.port === '6543';

        if (isSupabasePooler) {
            if (!parsed.searchParams.has('pgbouncer')) parsed.searchParams.set('pgbouncer', 'true');
            if (!parsed.searchParams.has('connection_limit')) parsed.searchParams.set('connection_limit', '1');
        }

        return parsed.toString();
    } catch {
        return rawUrl;
    }
};

const maskDatabaseUrl = (rawUrl: string): string => {
    try {
        const parsed = new URL(rawUrl);
        return `${parsed.protocol}//${parsed.username}@${parsed.hostname}:${parsed.port}${parsed.pathname}`;
    } catch {
        return 'invalid-url';
    }
};

const resolveDatabaseUrl = (): string => {
    const chosen = firstNonEmptyEnv('POSTGRES_PRISMA_URL', 'DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING');
    return chosen ? normalizeDatabaseUrl(chosen) : '';
};

const chosenDatabaseUrl = resolveDatabaseUrl();

const buildPrismaClient = (): PrismaClient => {
    if (!chosenDatabaseUrl) return new PrismaClient();
    return new PrismaClient({
        datasources: {
            db: {
                url: chosenDatabaseUrl
            }
        }
    });
};

const getDatabaseErrorDetail = (error: unknown): string | null => {
    if (!(error instanceof Error)) return null;
    const message = error.message;

    if (/Authentication failed/i.test(message)) {
        return 'Database authentication failed. Check DATABASE_URL on Vercel.';
    }

    if (/Tenant or user not found/i.test(message)) {
        return 'Database credentials are invalid for this Supabase project. Update DATABASE_URL in Vercel.';
    }

    if (/prepared statement .* already exists/i.test(message) || /42P05/.test(message)) {
        return 'Database pooler mismatch. Ensure DATABASE_URL includes pgbouncer=true and connection_limit=1.';
    }

    if (/Can.t reach database server/i.test(message) || /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(message)) {
        return 'Database server is unreachable from runtime. Check host, port, and network allowlist.';
    }

    return null;
};

const extractImageUrl = (source: AnyRecord): string | null => {
    const direct = pickFirst(source, ['imagem_url', 'image_url', 'image', 'imagem', 'thumbnail', 'foto']);
    if (typeof direct === 'string' && direct.trim()) return direct.trim();

    const list = pickFirst(source, ['images', 'imagens', 'pictures', 'photos']);
    if (Array.isArray(list)) {
        for (const item of list) {
            if (typeof item === 'string' && item.trim()) return item.trim();
            if (item && typeof item === 'object') {
                const url = pickFirst(item as AnyRecord, ['url', 'src', 'link']);
                if (typeof url === 'string' && url.trim()) return url.trim();
            }
        }
    }

    return null;
};

const extractCollection = (payload: unknown): AnyRecord[] => {
    if (Array.isArray(payload)) return payload.filter((item) => item && typeof item === 'object') as AnyRecord[];
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as AnyRecord;

    for (const key of ['items', 'results', 'data', 'products', 'content']) {
        const candidate = record[key];
        if (Array.isArray(candidate)) return candidate.filter((item) => item && typeof item === 'object') as AnyRecord[];
    }

    const nestedData = record.data;
    if (nestedData && typeof nestedData === 'object') {
        return extractCollection(nestedData);
    }

    return [];
};

const normalizeOlistProduct = (raw: AnyRecord): NormalizedOlistProduct | null => {
    const source = (raw.product && typeof raw.product === 'object')
        ? ({ ...(raw.product as AnyRecord), ...raw } as AnyRecord)
        : raw;

    const id_olist = pickString(source, ['id_olist', 'id', 'product_id', 'sku', 'codigo', 'codigo_produto']);
    if (!id_olist) return null;

    const nome = pickString(source, ['nome', 'name', 'titulo', 'title'], `Produto ${id_olist}`).slice(0, 200);
    const explicitSlug = pickString(source, ['slug', 'handle', 'seo_slug']);
    const slug = buildProductSlug(nome, id_olist, explicitSlug);

    const categoriaNomeRaw = pickString(source, ['categoria_nome', 'category_name', 'categoria', 'category'], DEFAULT_CATEGORY_NAME);
    const categoria_nome = categoriaNomeRaw || DEFAULT_CATEGORY_NAME;
    const categoria_slug = toSlug(pickString(source, ['categoria_slug', 'category_slug'], categoria_nome)) || DEFAULT_CATEGORY_SLUG;

    const descricao = pickString(source, ['descricao', 'description', 'detalhes', 'details'], nome) || nome;
    const codigo_barras = pickString(source, ['codigo_barras', 'barcode', 'ean', 'gtin']) || null;
    const imagem_url = extractImageUrl(source);

    const preco = toDecimalString(pickFirst(source, ['preco', 'price', 'sale_price', 'valor', 'valor_venda']), 2, 0);
    const estoque = Math.max(0, toInt(pickFirst(source, ['estoque', 'stock', 'quantity', 'saldo']), 0));
    const peso_kg = toDecimalString(pickFirst(source, ['peso_kg', 'weight', 'peso']), 3, 0.3);
    const comprimento_cm = toDecimalString(pickFirst(source, ['comprimento_cm', 'length', 'comprimento']), 2, 16);
    const altura_cm = toDecimalString(pickFirst(source, ['altura_cm', 'height', 'altura']), 2, 6);
    const largura_cm = toDecimalString(pickFirst(source, ['largura_cm', 'width', 'largura']), 2, 11);
    const criado_em = toDate(pickFirst(source, ['criado_em', 'created_at', 'createdAt']), new Date());
    const atualizado_em = toDate(pickFirst(source, ['atualizado_em', 'updated_at', 'updatedAt']), new Date());

    return {
        id_olist,
        nome,
        slug,
        descricao,
        preco,
        estoque,
        codigo_barras,
        imagem_url,
        peso_kg,
        comprimento_cm,
        altura_cm,
        largura_cm,
        categoria_nome,
        categoria_slug,
        criado_em,
        atualizado_em
    };
};

const formatProduto = (p: any) => ({
    id: toId(p.id),
    nome: p.nome,
    slug: p.slug ?? toId(p.id),
    descricao: p.descricao,
    preco: p.preco.toString(),
    estoque: p.estoque,
    codigo_barras: p.codigo_barras,
    imagem: p.imagem ? `/media/${p.imagem}` : null,
    imagem_url: p.imagem_url,
    peso_kg: p.peso_kg ? p.peso_kg.toString() : '0.000',
    comprimento_cm: p.comprimento_cm ? p.comprimento_cm.toString() : '0.00',
    altura_cm: p.altura_cm ? p.altura_cm.toString() : '0.00',
    largura_cm: p.largura_cm ? p.largura_cm.toString() : '0.00',
    categoria_nome: p.products_categoria?.nome ?? '',
    categoria_slug: p.products_categoria?.slug ?? '',
    categoria: p.products_categoria
        ? {
            id: toId(p.products_categoria.id),
            nome: p.products_categoria.nome,
            slug: p.products_categoria.slug
        }
        : null,
    criado_em: p.criado_em.toISOString(),
    atualizado_em: p.atualizado_em.toISOString()
});

const getOlistConfig = () => {
    const baseUrl = firstNonEmptyEnv('OLIST_API_BASE_URL', 'OLIST_BASE_URL') || OLIST_DEFAULT_BASE_URL;
    const token = firstNonEmptyEnv('OLIST_API_TOKEN', 'OLIST_TOKEN');
    const productsPath = firstNonEmptyEnv('OLIST_PRODUCTS_PATH') || OLIST_DEFAULT_PRODUCTS_PATH;
    const maxPages = Math.max(1, toInt(firstNonEmptyEnv('OLIST_SYNC_MAX_PAGES') || '10', 10));
    const pageSize = Math.max(1, toInt(firstNonEmptyEnv('OLIST_SYNC_PAGE_SIZE') || '100', 100));
    const timeoutMs = Math.max(5000, toInt(firstNonEmptyEnv('OLIST_SYNC_TIMEOUT_MS') || '20000', 20000));

    return {
        baseUrl,
        token,
        productsPath,
        maxPages,
        pageSize,
        timeoutMs
    };
};

const olistConfig = getOlistConfig();
const hasOlistConfig = Boolean(olistConfig.baseUrl && olistConfig.token);

const getOlistAuthorizationHeader = (token: string): string => {
    const trimmed = token.trim();
    if (/^(JWT|Bearer)\s+/i.test(trimmed)) return trimmed;
    return `JWT ${trimmed}`;
};

const getProvidedSyncSecret = (req: Request): string => {
    const querySecret = toSingleValue(req.query.secret as string | string[] | undefined);
    const headerSecret = toSingleValue(req.headers['x-sync-secret'] as string | string[] | undefined);
    const authHeader = toSingleValue(req.headers.authorization as string | string[] | undefined);
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return querySecret || headerSecret || bearer;
};

const isSyncAuthorized = (req: Request): boolean => {
    const expectedSecret = firstNonEmptyEnv('OLIST_SYNC_SECRET', 'CRON_SECRET');
    if (!expectedSecret) return true;
    return getProvidedSyncSecret(req) === expectedSecret;
};

let syncInFlight: Promise<OlistSyncSummary> | null = null;
let lastSyncSummary: OlistSyncSummary | null = null;

const fetchOlistProductsPage = async (page: number): Promise<{ items: AnyRecord[]; hasMore: boolean }> => {
    const baseURL = olistConfig.baseUrl.endsWith('/') ? olistConfig.baseUrl : `${olistConfig.baseUrl}/`;
    const urlPath = olistConfig.productsPath.startsWith('/') ? olistConfig.productsPath.slice(1) : olistConfig.productsPath;

    const response = await axios.get(urlPath, {
        baseURL,
        timeout: olistConfig.timeoutMs,
        headers: {
            Authorization: getOlistAuthorizationHeader(olistConfig.token),
            'X-Api-Key': olistConfig.token
        },
        params: {
            page,
            per_page: olistConfig.pageSize,
            limit: olistConfig.pageSize
        }
    });

    const items = extractCollection(response.data);
    const payload = response.data as AnyRecord;
    const hasMoreFromPayload = Boolean(
        payload?.has_more
        ?? payload?.hasNextPage
        ?? payload?.next
        ?? payload?.next_page
        ?? (payload?.pagination && (payload.pagination as AnyRecord).has_next)
    );
    const totalPages = toInt(
        payload?.total_pages
        ?? (payload?.pagination && (payload.pagination as AnyRecord).total_pages),
        0
    );
    const hasMore = totalPages > 0 ? page < totalPages : (hasMoreFromPayload || items.length >= olistConfig.pageSize);

    return { items, hasMore };
};

const syncOlistProducts = async (maxPagesInput?: number): Promise<OlistSyncSummary> => {
    if (!hasOlistConfig) {
        throw new Error('Olist integration is not configured. Set OLIST_API_BASE_URL and OLIST_API_TOKEN.');
    }

    const startedAt = new Date();
    const maxPages = Math.max(1, Math.min(maxPagesInput ?? olistConfig.maxPages, 100));
    let fetched = 0;
    let upserted = 0;
    let skipped = 0;
    let pagesProcessed = 0;

    for (let page = 1; page <= maxPages; page += 1) {
        const { items, hasMore } = await fetchOlistProductsPage(page);
        pagesProcessed += 1;

        if (items.length === 0) break;
        fetched += items.length;

        for (const item of items) {
            const normalized = normalizeOlistProduct(item);
            if (!normalized) {
                skipped += 1;
                continue;
            }

            const categoria = await prisma.products_categoria.upsert({
                where: { slug: normalized.categoria_slug },
                create: {
                    nome: normalized.categoria_nome.slice(0, 100),
                    slug: normalized.categoria_slug
                },
                update: {
                    nome: normalized.categoria_nome.slice(0, 100)
                }
            });

            await prisma.products_produto.upsert({
                where: { id_olist: normalized.id_olist },
                create: {
                    id_olist: normalized.id_olist,
                    nome: normalized.nome,
                    slug: normalized.slug,
                    descricao: normalized.descricao,
                    preco: normalized.preco,
                    estoque: normalized.estoque,
                    categoria_id: categoria.id,
                    codigo_barras: normalized.codigo_barras,
                    imagem: null,
                    imagem_url: normalized.imagem_url,
                    peso_kg: normalized.peso_kg,
                    comprimento_cm: normalized.comprimento_cm,
                    altura_cm: normalized.altura_cm,
                    largura_cm: normalized.largura_cm,
                    criado_em: normalized.criado_em,
                    atualizado_em: normalized.atualizado_em
                },
                update: {
                    nome: normalized.nome,
                    slug: normalized.slug,
                    descricao: normalized.descricao,
                    preco: normalized.preco,
                    estoque: normalized.estoque,
                    categoria_id: categoria.id,
                    codigo_barras: normalized.codigo_barras,
                    imagem_url: normalized.imagem_url,
                    peso_kg: normalized.peso_kg,
                    comprimento_cm: normalized.comprimento_cm,
                    altura_cm: normalized.altura_cm,
                    largura_cm: normalized.largura_cm,
                    atualizado_em: normalized.atualizado_em
                }
            });

            upserted += 1;
        }

        if (!hasMore) break;
    }

    const summary: OlistSyncSummary = {
        fetched,
        upserted,
        skipped,
        pagesProcessed,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString()
    };
    lastSyncSummary = summary;
    return summary;
};

const runOlistSync = async (maxPages?: number): Promise<OlistSyncSummary> => {
    if (syncInFlight) return syncInFlight;
    syncInFlight = syncOlistProducts(maxPages).finally(() => {
        syncInFlight = null;
    });
    return syncInFlight;
};

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://sm-glamour-store-2zb9.vercel.app',
        'https://sm-glamour-store.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-sync-secret']
}));

app.use(express.json());

const apiRouter = express.Router();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? buildPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

if (chosenDatabaseUrl) {
    console.log(`[DB] Using datasource ${maskDatabaseUrl(chosenDatabaseUrl)}`);
}

apiRouter.get('/health/db', async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'reachable', time: new Date().toISOString() });
    } catch (error) {
        console.error('Error pinging database:', error);
        const detail = getDatabaseErrorDetail(error) ?? 'Database is unreachable.';
        res.status(503).json({ status: 'error', detail, time: new Date().toISOString() });
    }
});

// --- OLIST SYNC ---
apiRouter.get('/integrations/olist/status', async (_req: Request, res: Response) => {
    res.json({
        configured: hasOlistConfig,
        base_url_configured: Boolean(olistConfig.baseUrl),
        token_configured: Boolean(olistConfig.token),
        products_path: olistConfig.productsPath,
        last_sync: lastSyncSummary
    });
});

apiRouter.post('/integrations/olist/sync', async (req: Request, res: Response) => {
    if (!isSyncAuthorized(req)) {
        return res.status(401).json({ detail: 'Unauthorized sync call.' });
    }

    try {
        const body = (req.body ?? {}) as AnyRecord;
        const maxPages = Math.max(1, Math.min(toInt(body.max_pages, olistConfig.maxPages), 100));
        const summary = await runOlistSync(maxPages);
        res.json({ status: 'ok', summary });
    } catch (error) {
        console.error('Error syncing Olist products:', error);
        res.status(500).json({
            detail: error instanceof Error ? error.message : 'Failed to sync Olist products.'
        });
    }
});

// --- DESTAQUES (Bestsellers curated by admin) ---
apiRouter.get('/produtos/destaques', async (_req: Request, res: Response) => {
    try {
        // First try products marked as destaque
        let destaques = await prisma.products_produto.findMany({
            where: { destaque: true },
            include: { products_categoria: true },
            orderBy: { atualizado_em: 'desc' },
            take: 10
        });

        // Fallback: if none marked, return top-stocked products
        if (destaques.length === 0) {
            destaques = await prisma.products_produto.findMany({
                include: { products_categoria: true },
                orderBy: { estoque: 'desc' },
                take: 8
            });
        }

        res.json(destaques.map(formatProduto));
    } catch (error) {
        console.error('Error fetching destaques:', error);
        const detail = getDatabaseErrorDetail(error);
        if (detail) return res.status(503).json({ detail });
        res.status(500).json({ detail: 'Internal server error' });
    }
});

// PATCH /api/admin/produtos/:id/destaque — toggle bestseller flag
apiRouter.patch('/admin/produtos/:id/destaque', async (req: Request, res: Response) => {
    try {
        const id = BigInt(String(req.params.id));
        const body = (req.body ?? {}) as { destaque?: boolean };
        const destaque = typeof body.destaque === 'boolean' ? body.destaque : true;

        const updated = await prisma.products_produto.update({
            where: { id },
            data: { destaque }
        });

        res.json({ success: true, destaque: updated.destaque });
    } catch (error) {
        console.error('Error toggling destaque:', error);
        res.status(500).json({ detail: 'Erro ao atualizar destaque.' });
    }
});

// --- PRODUCTS ---
apiRouter.get('/produtos', async (req: Request, res: Response) => {
    try {
        const { search, categoria } = req.query;
        let whereClause: any = {};

        if (typeof search === 'string' && search.trim()) {
            whereClause = {
                OR: [
                    { nome: { contains: search, mode: 'insensitive' } },
                    { descricao: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        if (typeof categoria === 'string' && categoria.trim() && categoria.toLowerCase() !== 'todas') {
            whereClause = {
                ...whereClause,
                products_categoria: {
                    slug: categoria
                }
            };
        }

        let produtos = await prisma.products_produto.findMany({
            where: whereClause,
            include: { products_categoria: true },
            orderBy: { atualizado_em: 'desc' }
        });

        if (
            produtos.length === 0
            && process.env.OLIST_SYNC_ON_EMPTY === 'true'
            && hasOlistConfig
        ) {
            await runOlistSync(1);
            produtos = await prisma.products_produto.findMany({
                where: whereClause,
                include: { products_categoria: true },
                orderBy: { atualizado_em: 'desc' }
            });
        }

        res.json(produtos.map(formatProduto));
    } catch (error) {
        console.error('Error fetching produtos:', error);
        const detail = getDatabaseErrorDetail(error);
        if (detail) return res.status(503).json({ detail });
        res.status(500).json({ detail: 'Internal server error' });
    }
});

apiRouter.get('/produtos/:slug', async (req: Request, res: Response) => {
    try {
        const slugOrId = toSingleValue(req.params.slug);
        let produto = await prisma.products_produto.findUnique({
            where: { slug: slugOrId },
            include: { products_categoria: true }
        });

        if (!produto && /^\d+$/.test(slugOrId)) {
            produto = await prisma.products_produto.findUnique({
                where: { id: BigInt(slugOrId) },
                include: { products_categoria: true }
            });
        }

        if (!produto) return res.status(404).json({ detail: 'Not found.' });
        res.json(formatProduto(produto));
    } catch (error) {
        console.error('Error fetching produto:', error);
        const detail = getDatabaseErrorDetail(error);
        if (detail) return res.status(503).json({ detail });
        res.status(500).json({ detail: 'Internal server error' });
    }
});

// --- CATEGORIAS ---
apiRouter.get('/categorias', async (_req: Request, res: Response) => {
    try {
        const categorias = await prisma.products_categoria.findMany({
            orderBy: { nome: 'asc' }
        });
        res.json(categorias.map((c) => ({
            id: toId(c.id),
            nome: c.nome,
            slug: c.slug
        })));
    } catch (error) {
        console.error('Error fetching categorias:', error);
        const detail = getDatabaseErrorDetail(error);
        if (detail) return res.status(503).json({ detail });
        res.status(500).json({ detail: 'Internal server error' });
    }
});

apiRouter.get('/categorias/:slug', async (req: Request, res: Response) => {
    try {
        const slug = toSingleValue(req.params.slug);
        const categoria = await prisma.products_categoria.findUnique({ where: { slug } });
        if (!categoria) return res.status(404).json({ detail: 'Not found.' });

        res.json({
            id: toId(categoria.id),
            nome: categoria.nome,
            slug: categoria.slug
        });
    } catch (error) {
        console.error('Error fetching categoria:', error);
        const detail = getDatabaseErrorDetail(error);
        if (detail) return res.status(503).json({ detail });
        res.status(500).json({ detail: 'Internal server error' });
    }
});

// --- SHIPPING / MELHOR ENVIO ---
apiRouter.post('/integrations/shipping/calculate', async (req: Request, res: Response) => {
    try {
        const body = (req.body ?? {}) as AnyRecord;
        const toPostalCode = sanitizePostalCode(body.to_postal_code ?? body.cep);
        const products = body.products ?? body.produtos;

        if (!toPostalCode || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ detail: 'CEP de destino e lista de produtos são obrigatórios.' });
        }

        const options = [
            {
                id: 'pac-demo',
                nome: 'Correios PAC (Demo)',
                valor: '25.50',
                prazo_dias: 7
            },
            {
                id: 'sedex-demo',
                nome: 'Correios SEDEX (Demo)',
                valor: '42.90',
                prazo_dias: 3
            }
        ];

        const normalized = options.map((opt) => ({
            ...opt,
            name: opt.nome,
            price: opt.valor,
            delivery_time: opt.prazo_dias,
            currency: 'R$',
            custom_price: opt.valor,
            custom_delivery_time: opt.prazo_dias,
            discount: '0.00',
            error: null
        }));

        res.json(normalized);
    } catch (error) {
        console.error('Error calculating shipping:', error);
        res.status(500).json({ detail: 'Error simulating shipping calculation' });
    }
});

// --- ADMIN IMAGE UPLOAD ---
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, name);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/admin/produtos/:id/imagem — upload image for a product
apiRouter.post('/admin/produtos/:id/imagem', upload.single('imagem'), async (req: Request, res: Response) => {
    try {
        const id = BigInt(String(req.params.id));
        if (!req.file) return res.status(400).json({ detail: 'Nenhum arquivo enviado.' });

        const imagemUrl = `/uploads/${req.file.filename}`;
        await prisma.products_produto.update({
            where: { id },
            data: { imagem_url: imagemUrl }
        });

        res.json({ success: true, imagem_url: imagemUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ detail: 'Erro ao fazer upload da imagem.' });
    }
});

// GET /api/admin/produtos — list all products for admin
apiRouter.get('/admin/produtos', async (_req: Request, res: Response) => {
    try {
        const produtos = await prisma.products_produto.findMany({
            include: { products_categoria: true },
            orderBy: { atualizado_em: 'desc' }
        });
        res.json(produtos.map(formatProduto));
    } catch (error) {
        console.error('Error fetching admin produtos:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});

app.use('/api', apiRouter);

// --- RENDER.COM STATIC FRONTEND ---
const frontendDist = path.join(process.cwd(), 'dist');

// Serve uploaded product images from /uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Serve the compiled Vite Vue.js application
app.use(express.static(frontendDist));

// Catch-all route to serve index.html for Vue Router (History Mode)
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
});

// --- DAILY OLIST CRON JOB ---
// Runs every day at 03:00 AM (server time)
if (hasOlistConfig) {
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] Starting daily Olist sync...');
        try {
            const summary = await runOlistSync();
            console.log(`[Cron] Daily Olist sync completed: upserted=${summary.upserted} fetched=${summary.fetched} skipped=${summary.skipped}`);
        } catch (err) {
            console.error('[Cron] Daily Olist sync failed:', err);
        }
    });
    console.log('[Cron] Daily Olist sync scheduled at 03:00 AM.');
} else {
    console.warn('[Cron] Olist integration not configured - daily sync skipped.');
}

// Render passes the PORT environment variable dynamically
app.listen(port, () => {
    console.log(`SM Glamour Monorepo (Node.js + Vue) is running on port ${port}`);
});

export default app;
