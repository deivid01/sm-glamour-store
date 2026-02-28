# SM Glamour Store 💄✨

Um e-commerce premium, minimalista e de alta performance desenvolvido para a **SM Glamour Store**, especializado em cosméticos de luxo, perfumes e maquiagens.

Este projeto foca em uma experiência de usuário (UX) sofisticada, similar às grandes marcas do mercado (Dior, Chanel, Eudora), com integração total a sistemas reais de gestão de estoque e logística.

## 🚀 Tecnologias Utilizadas

### Frontend

- **Vue.js 3** (Composition API & `<script setup>`)
- **Vite** (Build Tool super rápido)
- **Tailwind CSS** (Estilização utilitária e design responsivo system)
- **Vue Router** (Single Page Application routing)
- **Pinia** (Gerenciamento de Estado para o Carrinho de Compras)

### Backend

- **Python & Django** (Framework web robusto)
- **Django Rest Framework (DRF)** (Criação da API RESTful)
- **SQLite** (Banco de dados padrão para desenvolvimento - _preparado para PostgreSQL em produção_)
- **Integração de APIs de Terceiros** (OpenBeautyFacts)

### Serviços Integrados

- **Olist / Tiny ERP**: Sincronização automática de produtos, estoque, preços e códigos de barras (GTIN).
- **OpenBeautyFacts API**: Fallback dinâmico que busca e faz upload de fotos reais de cosméticos a partir do código de barras EAN se o produto não tiver imagem.
- **Melhor Envio**: Simulação e cálculo de frete (Correios PAC, Sedex, Jadlog) diretamente no checkout.

## 🌟 Destaques do Projeto

- **Design Premium:** UI/UX cuidadosamente elaborada com cores da paleta 'Glamour' (Soft Rose, Gold, Black), tipografias com serifa, micro-interações, hover states e animações modernas.
- **Carrinho Inteligente (`Side Cart`)**: Visualização rápida e não intrusiva dos itens no carrinho.
- **Integração Real-Time**: O backend recebe webhooks e sincroniza catálogo com o ERP da loja.
- **Painel Administrativo:** Interface do Django Admin já pré-configurada para os donos da loja realizarem o upload manual de banners e fotos de produtos.
- **Fallback Automático de Imagens**: Se um produto vindo do ERP não possuir foto oficial e nem foto no Django, o backend busca a foto na API mundial de cosméticos pelo código de barras, ou exibe placeholders em alta resolução gerados por IA.

## 💻 Como Rodar o Projeto (Desenvolvimento Local)

### Pré-requisitos

- Node.js (versão 18+)
- Python (versão 3.10+)

### 1. Iniciar o Backend (Django API)

```bash
cd backend
python -m venv venv
# Ative o venv (Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt # (se houver, ou instale django djangorestframework django-cors-headers requests Pillow)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

_O painel de administrador pode ser acessado em `http://localhost:8000/admin` (É necessário criar um superuser)._

### 2. Iniciar o Frontend (Vue.js)

```bash
cd frontend
npm install
npm run dev
```

_Acesse `http://localhost:5173` no seu navegador._

## 👨‍💻 Desenvolvedor

Desenvolvido com 🖤 por **Deivid Peres**.

- GitHub: [github.com/deivid01](https://github.com/deivid01)

---

## ☁️ Arquitetura de Hospedagem (Deploy)

O projeto foi construído separando o Frontend (Vue) do Backend (Django API), o que permite alta flexibilidade na hospedagem.

### 1. Hospedagem de Produção (Hostinger)

Para a operação real da loja, **todo o sistema** (Frontend e Backend) será hospedado na **Hostinger**:

- **Frontend:** Os arquivos estáticos gerados pelo comando `npm run build` podem ser colocados diretamente no painel da Hostinger (Plano Web ou Hostinger panel) ou servidos via Nginx.
- **Backend Django:** Requer um plano **VPS** na Hostinger (ou hospedagem Cloud que suporte Python/Gunicorn). É recomendado utilizar **PostgreSQL** como banco de dados ao invés do SQLite padrão.
- **Vantagem:** Dados centralizados, mesmo IP, gestão facilitada de DNS e banco de dados robusto de alta performance diretamente nos servidores Hostinger.

### 2. Ambiente de Demonstração (Vercel)

Para apresentação rápida à dona da loja:

- **Frontend (Vercel):** Basta conectar este repositório do GitHub na Vercel e ela criará uma URL de demonstração instantânea (ex: `sm-glamour-store.vercel.app`).
- **Backend (Demo):** O Django temporário de demonstração precisará rodar em serviços gratuitos de nuvem (como Render.com, PythonAnywhere ou Railway) apenas para manter o banco de dados (SQLite) vivo e conectado à Vercel durante a aprovação, já que a Vercel não executa servidores Python contínuos com bancos SQL nativos.

_Desenvolvido com foco em escalabilidade e performance para o luxo._
