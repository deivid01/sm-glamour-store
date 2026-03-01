import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';

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

const buildPrismaClient = (): PrismaClient => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return new PrismaClient();

    return new PrismaClient({
        datasources: {
            db: {
                url: normalizeDatabaseUrl(databaseUrl)
            }
        }
    });
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? buildPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

const app = express();
const port = process.env.PORT || 8000;

// Enable CORS explicitly for our Vite frontend and Vercel domains
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://sm-glamour-store-2zb9.vercel.app',
        'https://sm-glamour-store.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Main API Router matches what Django did (/api)
const apiRouter = express.Router();

import { Request, Response } from 'express';

const toId = (value: unknown): string => {
    if (typeof value === 'bigint') return value.toString();
    if (value === null || value === undefined) return '';
    return String(value);
};

const toSingleValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
};

const getDatabaseErrorDetail = (error: unknown): string | null => {
    if (!(error instanceof Error)) return null;

    if (/Authentication failed/i.test(error.message)) {
        return 'Database authentication failed. Check DATABASE_URL.';
    }

    if (/prepared statement .* already exists/i.test(error.message) || /42P05/.test(error.message)) {
        return 'Database pooler mismatch. Ensure DATABASE_URL includes pgbouncer=true and connection_limit=1.';
    }

    return null;
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

// --- PRODUCTS ---
apiRouter.get('/produtos', async (req: Request, res: Response) => {
    try {
        const { search, categoria } = req.query;
        let whereClause: any = {};

        // Exact match of logic from Django views
        if (typeof search === 'string' && search.trim()) {
            whereClause = {
                OR: [
                    { nome: { contains: search, mode: 'insensitive' } },
                    { descricao: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        if (typeof categoria === 'string' && categoria.trim() && categoria !== 'Todas') {
            whereClause = {
                ...whereClause,
                products_categoria: {
                    slug: categoria
                }
            };
        }

        const produtos = await prisma.products_produto.findMany({
            where: whereClause,
            include: {
                products_categoria: true // Like serializer nesting
            },
            orderBy: {
                atualizado_em: 'desc'
            }
        });

        res.json(produtos.map(formatProduto));
    } catch (error) {
        console.error('Error fetching produtos:', error);
        const databaseErrorDetail = getDatabaseErrorDetail(error);
        if (databaseErrorDetail) {
            return res.status(503).json({ detail: databaseErrorDetail });
        }
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

        if (!produto) {
            return res.status(404).json({ detail: 'Not found.' });
        }

        res.json(formatProduto(produto));
    } catch (error) {
        console.error('Error fetching produto:', error);
        const databaseErrorDetail = getDatabaseErrorDetail(error);
        if (databaseErrorDetail) {
            return res.status(503).json({ detail: databaseErrorDetail });
        }
        res.status(500).json({ detail: 'Internal server error' });
    }
});

// --- CATEGORIAS ---
apiRouter.get('/categorias', async (req: Request, res: Response) => {
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
        const databaseErrorDetail = getDatabaseErrorDetail(error);
        if (databaseErrorDetail) {
            return res.status(503).json({ detail: databaseErrorDetail });
        }
        res.status(500).json({ detail: 'Internal server error' });
    }
});

apiRouter.get('/categorias/:slug', async (req: Request, res: Response) => {
    try {
        const slug = toSingleValue(req.params.slug);
        const categoria = await prisma.products_categoria.findUnique({
            where: { slug }
        });

        if (!categoria) {
            return res.status(404).json({ detail: 'Not found.' });
        }
        res.json({
            id: toId(categoria.id),
            nome: categoria.nome,
            slug: categoria.slug
        });
    } catch (error) {
        console.error('Error fetching categoria:', error);
        const databaseErrorDetail = getDatabaseErrorDetail(error);
        if (databaseErrorDetail) {
            return res.status(503).json({ detail: databaseErrorDetail });
        }
        res.status(500).json({ detail: 'Internal server error' });
    }
});

// --- SHIPPING / MELHOR ENVIO ---
apiRouter.post('/integrations/shipping/calculate', async (req: Request, res: Response) => {
    try {
        const { to_postal_code, products } = req.body;

        if (!to_postal_code || !products || products.length === 0) {
            return res.status(400).json({ detail: "CEP de destino e lista de produtos (peso, dimensões) são obrigatórios." });
        }

        // Mock Melhor Envio response with standard Correios Options for the Demo
        const mockResponse = [
            {
                id: 1,
                name: "Correios PAC (Demo)",
                price: "25.50",
                custom_price: "25.50",
                discount: "0.00",
                currency: "R$",
                delivery_time: 7,
                custom_delivery_time: 7,
                error: null
            },
            {
                id: 2,
                name: "Correios SEDEX (Demo)",
                price: "42.90",
                custom_price: "42.90",
                discount: "0.00",
                currency: "R$",
                delivery_time: 3,
                custom_delivery_time: 3,
                error: null
            }
        ];

        // Return the simulated data
        res.json(mockResponse);
    } catch (error: any) {
        console.error('Error calculating shipping:', error);
        res.status(500).json({ detail: 'Error simulating shipping calculation' });
    }
});

app.use('/api', apiRouter);

// Basic health check for Vercel
app.get('/', (req: Request, res: Response) => {
    res.json({ status: 'ok', engine: 'node-express', time: new Date().toISOString() });
});

// Start the server (mostly for local development, Vercel exports the app)
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`SM Glamour Node.js Backend is running on http://localhost:${port}`);
    });
}

export default app;
