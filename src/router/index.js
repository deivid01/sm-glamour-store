import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CatalogoView from '../views/CatalogoView.vue'
import ProdutoView from '../views/ProdutoView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import SobreView from '../views/SobreView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { title: 'Início | SM Glamour Store' }
        },
        {
            path: '/catalogo',
            name: 'catalogo',
            component: CatalogoView,
            meta: { title: 'Catálogo de Produtos | SM Glamour Store' }
        },
        {
            path: '/produto/:slug',
            name: 'produto_detalhe',
            component: ProdutoView,
            meta: { title: 'Detalhes do Produto | SM Glamour Store' }
        },
        {
            path: '/checkout',
            name: 'checkout',
            component: CheckoutView,
            meta: { title: 'Finalizar Pedido | SM Glamour Store' }
        },
        {
            path: '/sobre',
            name: 'sobre',
            component: SobreView,
            meta: { title: 'Sobre Nós | SM Glamour Store' }
        },
        {
            path: '/admin',
            name: 'admin',
            component: AdminView,
            meta: { title: 'Painel Admin | SM Glamour Store' }
        }
    ],
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// SEO: Atualizar Titulo da Pagina dinamicamente
router.beforeEach((to, from, next) => {
    document.title = to.meta.title || 'SM Glamour Store | Beleza & Autocuidado'
    next()
})

export default router

