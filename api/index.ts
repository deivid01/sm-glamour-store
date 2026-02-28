import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const prisma = new PrismaClient();
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

// --- PRODUCTS ---
apiRouter.get('/produtos', async (req: Request, res: Response) => {
    try {
        const { search, categoria } = req.query;
        let whereClause = {};

        // Exact match of logic from Django views
        if (search) {
            whereClause = {
                OR: [
                    { nome: { contains: search, mode: 'insensitive' } },
                    { descricao: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        if (categoria) {
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

        // Format to match Django's exact JSON structure
        const formattedProdutos = produtos.map((p: any) => ({
            id: p.id,
            nome: p.nome,
            slug: p.slug,
            descricao: p.descricao,
            preco: p.preco.toString(),
            estoque: p.estoque,
            codigo_barras: p.codigo_barras,
            imagem: p.imagem ? `/media/${p.imagem}` : null,
            imagem_url: p.imagem_url,
            peso_kg: p.peso_kg ? p.peso_kg.toString() : "0.000",
            comprimento_cm: p.comprimento_cm ? p.comprimento_cm.toString() : "0.00",
            altura_cm: p.altura_cm ? p.altura_cm.toString() : "0.00",
            largura_cm: p.largura_cm ? p.largura_cm.toString() : "0.00",
            categoria: {
                id: p.products_categoria.id,
                nome: p.products_categoria.nome,
                slug: p.products_categoria.slug
            },
            criado_em: p.criado_em.toISOString(),
            atualizado_em: p.atualizado_em.toISOString()
        }));

        res.json(formattedProdutos);
    } catch (error) {
        console.error('Error fetching produtos:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});

apiRouter.get('/produtos/:slug', async (req: Request, res: Response) => {
    try {
        const produto = await prisma.products_produto.findUnique({
            where: { slug: req.params.slug },
            include: { products_categoria: true }
        });

        if (!produto) {
            return res.status(404).json({ detail: 'Not found.' });
        }

        const formatted = {
            id: produto.id,
            nome: produto.nome,
            slug: produto.slug,
            descricao: produto.descricao,
            preco: produto.preco.toString(),
            estoque: produto.estoque,
            codigo_barras: produto.codigo_barras,
            imagem: produto.imagem ? `/media/${produto.imagem}` : null,
            imagem_url: produto.imagem_url,
            peso_kg: produto.peso_kg ? produto.peso_kg.toString() : "0.000",
            comprimento_cm: produto.comprimento_cm ? produto.comprimento_cm.toString() : "0.00",
            altura_cm: produto.altura_cm ? produto.altura_cm.toString() : "0.00",
            largura_cm: produto.largura_cm ? produto.largura_cm.toString() : "0.00",
            categoria: {
                id: produto.products_categoria.id,
                nome: produto.products_categoria.nome,
                slug: produto.products_categoria.slug
            },
            criado_em: produto.criado_em.toISOString(),
            atualizado_em: produto.atualizado_em.toISOString()
        };

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching produto:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});

// --- CATEGORIAS ---
apiRouter.get('/categorias', async (req: Request, res: Response) => {
    try {
        const categorias = await prisma.products_categoria.findMany({
            orderBy: { nome: 'asc' }
        });
        res.json(categorias);
    } catch (error) {
        console.error('Error fetching categorias:', error);
        res.status(500).json({ detail: 'Internal server error' });
    }
});

apiRouter.get('/categorias/:slug', async (req: Request, res: Response) => {
    try {
        const categoria = await prisma.products_categoria.findUnique({
            where: { slug: req.params.slug }
        });

        if (!categoria) {
            return res.status(404).json({ detail: 'Not found.' });
        }
        res.json(categoria);
    } catch (error) {
        console.error('Error fetching categoria:', error);
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
