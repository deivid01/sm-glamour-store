# SM Glamour Store

Loja em Vue 3 + Vite com API Node/Express (Serverless na Vercel) e PostgreSQL via Prisma.

## Fluxo de dados

1. Produtos sao sincronizados da API da Olist para o PostgreSQL.
2. O frontend consome apenas `/api/produtos` e `/api/produtos/:slug`.
3. Frete e calculado por `/api/integrations/shipping/calculate` (mock de demo com formato compativel).

## Variaveis de ambiente

Defina no ambiente local e na Vercel:

- `DATABASE_URL` (Supabase/Postgres)
- `OLIST_API_BASE_URL` (ex: `https://api.olist.com`)
- `OLIST_API_TOKEN`
- `OLIST_PRODUCTS_PATH` (opcional, default: `/products`)
- `OLIST_SYNC_SECRET` (opcional, protege o endpoint de sync)
- `OLIST_SYNC_MAX_PAGES` (opcional, default: `10`)
- `OLIST_SYNC_PAGE_SIZE` (opcional, default: `100`)
- `OLIST_SYNC_ON_EMPTY` (opcional: `true` para sync automatico se o catalogo estiver vazio)

### Observacoes de DATABASE_URL (Supabase pooler)

A API normaliza automaticamente para `pgbouncer=true` e `connection_limit=1` quando detecta pooler (`:6543`), mas a credencial precisa estar correta.

Se aparecer `Tenant or user not found` nos logs da Vercel, a `DATABASE_URL` da Vercel esta incorreta e precisa ser atualizada.

## Endpoints principais

- `GET /api/health/db` checa conectividade do banco
- `GET /api/integrations/olist/status` status da configuracao Olist
- `POST /api/integrations/olist/sync` sincroniza Olist -> PostgreSQL
- `GET /api/produtos` lista catalogo
- `GET /api/produtos/:slug` detalhe

### Exemplo de sync manual

```bash
curl -X POST "https://SEU-DOMINIO/api/integrations/olist/sync" \
  -H "Content-Type: application/json" \
  -H "x-sync-secret: SEU_SECRET" \
  -d '{"max_pages": 5}'
```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npx tsc -p tsconfig.json --noEmit
```
