<div align="center">
  <img src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=2000&auto=format&fit=crop" alt="SM Glamour Store" width="100%" style="border-radius: 20px; margin-bottom: 20px;" />
  
  <h1>✨ SM Glamour Store</h1>
  <p><strong>E-commerce Premium de Autocuidado & Cosméticos</strong></p>
  
  <p>
    <a href="#-sobre-o-projeto">Sobre</a> •
    <a href="#%EF%B8%8F-tecnologias-e-stack">Stack</a> •
    <a href="#-funcionalidades">Funcionalidades</a> •
    <a href="#-arquitetura-e-integrações">Integrações</a> •
    <a href="#-como-executar">Como Executar</a>
  </p>
</div>

---

## 📖 Sobre o Projeto

A **SM Glamour Store** é uma plataforma de e-commerce moderna, rápida e responsiva construída do zero para oferecer produtos de beleza e cosméticos. Focada na experiência do usuário (UX) e em uma interface premium (UI), a loja oferece um design dinâmico com suporte nativo a **Dark Mode**, transições suaves e um fluxo de checkout transparente altamente otimizado.

O projeto foi desenvolvido em uma arquitetura de **Monorepo**, unificando um frontend reativo e um backend robusto em um único repositório, facilitando o deploy contínuo em plataformas como o Render.

---

## 🛠️ Tecnologias e Stack

O projeto utiliza tecnologias modernas e escaláveis tanto no cliente quanto no servidor:

### 🎨 Frontend (Cliente)

- **[Vue.js 3](https://vuejs.org/)**: Framework reativo utilizando a Composition API (`<script setup>`).
- **[Vite](https://vitejs.dev/)**: Bundler ultrarrápido para desenvolvimento e build.
- **[Tailwind CSS](https://tailwindcss.com/)**: Estilização baseada em classes utilitárias, permitindo a criação de um design system customizado (paleta `glamour`) e suporte fácil ao Dark Mode.
- **[Pinia](https://pinia.vuejs.org/)**: Gerenciamento de estado global (usado para o Carrinho de Compras e persistência do Tema).
- **[Vue Router](https://router.vuejs.org/)**: Roteamento no lado do cliente com guardas de rota (usado no painel de administração).

### ⚙️ Backend (Servidor)

- **[Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)**: API RESTful ágil e flexível para lidar com rotas de pagamento, sincronização e administração.
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática garantindo segurança e confiabilidade no código do servidor.
- **[Prisma ORM](https://www.prisma.io/)**: Mapeamento objeto-relacional moderno e typesafe para comunicação com o banco de dados.
- **[Multer](https://github.com/expressjs/multer)**: Middleware para upload e gerenciamento local das imagens de produtos do Admin.
- **[node-cron](https://www.npmjs.com/package/node-cron)**: Agendador de tarefas para rotinas em background (ex: sincronização diária de produtos).

### 🗄️ Banco de Dados & Infraestrutura

- **[PostgreSQL](https://www.postgresql.org/)**: Banco de dados relacional poderoso e open-source.
- **[Supabase](https://supabase.com/)**: Plataforma de hospedagem do PostgreSQL (BaaS), utilizada com connection pooling (`pgbouncer`).
- **[Render](https://render.com/)**: Plataforma de Cloud Hosting onde o Monorepo (Node.js + Vue build estático) está implantado, com CI/CD automático direto do GitHub.

---

## ✨ Funcionalidades

- **Design Premium & Responsivo**: Interface minimalista com tema Claro e Escuro (Dark Mode) sincronizado com a preferência do sistema operacional do usuário.
- **Catálogo Dinâmico**: Listagem de produtos com filtros por categoria e barra de pesquisa inteligente.
- **Seção "Mais Vendidos" (Destaques)**: Curadoria manual de produtos exibidos na Home, controlada diretamente pelo painel administrativo.
- **Carrinho de Compras Persistente**: Gerenciamento de itens e cálculos de subtotal em tempo real usando Pinia.
- **Painel Administrativo Autenticado**:
  - Login protegido por credenciais.
  - Sincronização manual e status da integração com ERP.
  - Upload/troca de imagens de produtos.
  - Marcação de produtos em "Destaque" (Star Toggle).
- **Cálculo de Frete**: Integração via API para estimativa de custo e prazo baseada no CEP do cliente.

---

## 🔌 Arquitetura e Integrações

O backend atua como um BFF (Backend For Frontend), orquestrando as seguintes integrações externas:

1. **Olist / Tiny ERP**:
   - Rotina automatizada de sincronização de catálogo (via `node-cron` rodando às 03:00 AM).
   - Importação contínua de novos produtos, preços, estoque e descrições sem necessidade de intervenção manual.
2. **Mercado Pago (Gateway de Pagamento)**:
   - **Checkout Transparente**: Integração com o _Payment Bricks_ (SDK JS v2), mantendo o cliente no ambiente da loja durante todo o pagamento.
   - Suporte a PIX, Cartão de Crédito/Débito e Boleto bancário.
   - Rotas seguras de backend para criação de preferências (`/preferencia`), recebimento de Webhooks (`/webhook`) e consulta de status (`/status`).
3. **Logística (Melhor Envio / Correios)**:
   - Cálculo dinâmico de frete integrado diretamente na primeira etapa do fluxo de finalização de pedido.

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 20.x recomendada)
- [Git](https://git-scm.com/)
- Conta no Supabase (ou um banco PostgreSQL local)
- Credenciais do Mercado Pago e Olist (opcional para desenvolvimento puro UI)

### Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/deivid01/sm-glamour-store.git
   cd sm-glamour-store
   ```

2. **Instale as dependências do Monorepo:**

   ```bash
   npm install
   ```

   _(Isso instalará tanto as dependências do backend quanto as do frontend em suas respectivas pastas estruturais)_

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as seguintes chaves (substitua pelos seus dados):

   ```env
   # Banco de Dados (Supabase/PostgreSQL)
   DATABASE_URL="postgresql://user:password@host:5432/postgres"

   # Olist/Tiny API Auth
   TINY_TOKEN="seu_token_olist_aqui"

   # Mercado Pago (Backend & Frontend)
   MP_ACCESS_TOKEN="seu_access_token_mp_aqui"
   MP_PUBLIC_KEY="sua_public_key_mp_aqui"
   VITE_MP_PUBLIC_KEY="sua_public_key_mp_aqui"

   # URL base (usada para Webhooks e Callbacks)
   APP_URL="http://localhost:3000"
   ```

4. **Prepare o Banco de Dados (Prisma):**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Inicie os Servidores de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   _O Vite subirá na porta `5173` (Frontend) e o Express (via tsx/nodemon) na porta `3000` (Backend)._

---

### 📦 Build para Produção (Render)

A infraestrutura atual está configurada via `render.yaml`. O processo de build compila o frontend primeiro, depois o backend, servindo o Vue.js estático através do próprio servidor Express.

```bash
# Compila o Vue e o TypeScript do servidor
npm run build

# Inicia o servidor Node.js
npm start
```

---

<div align="center">
  <p>Feito com ❤️ e muita dedicação para o universo da beleza.</p>
</div>
