<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ProductCard from '../components/ProductCard.vue'

const featuredProducts = ref([])
const bestsellers = ref([])
const loading = ref(true)
const loadingBestsellers = ref(true)

const mapProduct = (p) => ({
  id: p.id,
  name: p.nome,
  slug: p.slug,
  category: p.categoria?.nome || p.categoria_nome || 'Sem categoria',
  price: parseFloat(p.preco),
  image: p.imagem_url || '/images/product_fallback.png',
  isNew: false
})

onMounted(async () => {
  // Load featured (first 4) and bestsellers in parallel
  const [featuredRes, bestsellersRes] = await Promise.allSettled([
    axios.get('/api/produtos/'),
    axios.get('/api/produtos/destaques')
  ])

  if (featuredRes.status === 'fulfilled') {
    featuredProducts.value = featuredRes.value.data.slice(0, 4).map(mapProduct)
  }
  loading.value = false

  if (bestsellersRes.status === 'fulfilled') {
    bestsellers.value = bestsellersRes.value.data.slice(0, 10).map(mapProduct)
  }
  loadingBestsellers.value = false
})
</script>

<template>
  <div class="bg-[#FAF9F6] dark:bg-[#0F0A1E] text-stone-900 dark:text-stone-100 overflow-hidden font-sans transition-colors duration-300">
    
    <!-- Hero Section (Minimalist & Edge-to-Edge) -->
    <section class="relative h-[85vh] w-full flex items-center justify-center">
      <img src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=2000&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover object-center" alt="Hero Skin Care" />
      <div class="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px]"></div>
      
      <div class="relative z-10 flex flex-col items-center text-center px-4 mt-16">
        <h1 class="text-6xl md:text-8xl font-serif text-white mb-6 drop-shadow-md font-light tracking-tight">
          Pura. Essencial.
        </h1>
        <p class="text-white text-sm md:text-base tracking-[0.3em] uppercase max-w-lg mb-10 opacity-90 font-light drop-shadow">
          A nova coleção de beleza chegou.
        </p>
        <a href="/catalogo" class="bg-white text-black px-12 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-glamour-primary hover:text-white transition-all duration-300 shadow-xl hover:-translate-y-1">
          Comprar Agora
        </a>
      </div>
    </section>

    <!-- Category Pills (Modern e-commerce) -->
    <section class="py-20 px-4 max-w-7xl mx-auto bg-[#FAF9F6] dark:bg-[#0F0A1E] transition-colors">
      <div class="flex flex-nowrap overflow-x-auto gap-6 md:gap-12 hide-scrollbar snap-x pb-4 justify-start md:justify-center">
        <!-- Cat 1 -->
        <a href="/catalogo" class="flex flex-col items-center gap-4 group snap-center min-w-[100px] md:min-w-[120px]">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-stone-200 dark:border-purple-900/50 p-1 group-hover:border-black dark:group-hover:border-glamour-primary transition-colors duration-500 bg-white dark:bg-[#1a0a2e]">
            <div class="w-full h-full rounded-full overflow-hidden">
               <img src="/images/skincare.png" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Skincare" />
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300 group-hover:text-black dark:group-hover:text-glamour-primary transition-colors">Skincare</span>
        </a>
        <!-- Cat 2 -->
        <a href="/catalogo" class="flex flex-col items-center gap-4 group snap-center min-w-[100px] md:min-w-[120px]">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-stone-200 dark:border-purple-900/50 p-1 group-hover:border-black dark:group-hover:border-glamour-primary transition-colors duration-500 bg-white dark:bg-[#1a0a2e]">
            <div class="w-full h-full rounded-full overflow-hidden">
               <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=500" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Perfumes" />
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300 group-hover:text-black dark:group-hover:text-glamour-primary transition-colors">Perfumes</span>
        </a>
        <!-- Cat 3 -->
        <a href="/catalogo" class="flex flex-col items-center gap-4 group snap-center min-w-[100px] md:min-w-[120px]">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-stone-200 p-1 group-hover:border-black transition-colors duration-500 bg-white">
            <div class="w-full h-full rounded-full overflow-hidden">
               <img src="/images/makeup.png" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Make" />
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300 group-hover:text-black dark:group-hover:text-glamour-primary transition-colors">Maquiagem</span>
        </a>
        <!-- Cat 4 -->
        <a href="/catalogo" class="flex flex-col items-center gap-4 group snap-center min-w-[100px] md:min-w-[120px]">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-stone-200 p-1 group-hover:border-black transition-colors duration-500 bg-white">
            <div class="w-full h-full rounded-full overflow-hidden">
               <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Corpo" />
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-600 group-hover:text-black transition-colors">Corpo & Banho</span>
        </a>
      </div>
    </section>

    <!-- Bestsellers -->
    <section class="py-20 px-4 max-w-7xl mx-auto border-t border-stone-200/50">
      <div class="flex justify-between items-end mb-12">
        <div>
          <h2 class="text-3xl md:text-5xl font-serif font-light mb-3 text-stone-900">Mais Desejados</h2>
          <p class="text-stone-500 text-sm md:text-base font-light tracking-wide">A escolha de quem entende de beleza.</p>
        </div>
        <a href="/catalogo" class="hidden md:inline-block border-b border-black text-xs font-bold uppercase tracking-widest pb-1 hover:text-glamour-primary hover:border-glamour-primary transition-colors">
          Ver Coleção Completa
        </a>
      </div>

      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <div v-for="i in 4" :key="i" class="h-[450px] bg-stone-200 dark:bg-stone-800/50 animate-pulse rounded-2xl"></div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <ProductCard 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :product="product" 
        />
      </div>
      
      <div class="mt-16 text-center md:hidden">
         <a href="/catalogo" class="inline-block border border-black dark:border-stone-400 text-stone-900 dark:text-stone-300 px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-glamour-primary hover:text-white transition-colors">
          Ver Coleção Completa
        </a>
      </div>
    </section>

    <!-- MAIS VENDIDOS / DESTAQUES -->
    <section class="py-20 px-4 bg-stone-100/70 dark:bg-[#0d0820] transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-end mb-12">
          <div>
            <span class="text-[10px] uppercase tracking-[0.3em] text-glamour-primary font-bold block mb-3">⭐ Curadoria da Stéphanie</span>
            <h2 class="text-3xl md:text-5xl font-serif font-light text-stone-900 dark:text-stone-100">Mais Vendidos</h2>
            <p class="text-stone-500 dark:text-stone-400 text-sm font-light tracking-wide mt-2">Os produtos favoritos das nossas clientes.</p>
          </div>
          <a href="/catalogo" class="hidden md:inline-block border-b border-stone-400 dark:border-stone-500 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-widest pb-1 hover:text-glamour-primary hover:border-glamour-primary transition-colors">
            Ver Todos
          </a>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loadingBestsellers" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div v-for="i in 5" :key="i" class="h-[340px] bg-stone-200 dark:bg-stone-800/50 animate-pulse rounded-2xl"></div>
        </div>

        <!-- Products grid — up to 10 items, 5 columns on large screens -->
        <div v-else-if="bestsellers.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
          <a v-for="product in bestsellers" :key="product.id" :href="`/produto/${product.slug}`"
            class="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#1a0a2e] border border-transparent hover:border-glamour-primary/30 shadow-sm hover:shadow-xl transition-all duration-300">
            <div class="relative aspect-square overflow-hidden bg-stone-100 dark:bg-stone-800">
              <img :src="product.image" :alt="product.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                @error="(e) => e.target.src = '/images/product_fallback.png'"
              />
              <div class="absolute top-2 left-2 bg-glamour-primary text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                ⭐ Destaque
              </div>
            </div>
            <div class="p-4 flex flex-col gap-1">
              <p class="text-[10px] uppercase tracking-widest text-glamour-gold font-semibold">{{ product.category }}</p>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">{{ product.name }}</h3>
              <p class="text-glamour-primary font-bold text-base mt-1">R$ {{ product.price.toFixed(2) }}</p>
            </div>
          </a>
        </div>

        <!-- Empty state: no destaques yet -->
        <div v-else class="text-center py-12 text-stone-400 dark:text-stone-600">
          <p class="text-3xl mb-3">☆</p>
          <p class="text-sm">Nenhum produto marcado como destaque ainda.</p>
          <p class="text-xs mt-1">Acesse o <a href="/admin" class="text-glamour-primary underline">painel admin</a> para selecionar os mais vendidos.</p>
        </div>
      </div>
    </section>

    <!-- Editorial / Split Banner -->
    <section class="py-10 mb-20">
      <div class="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[600px] overflow-hidden md:pl-4 lg:pl-8 lg:pr-8 gap-8">
        <div class="h-[60vh] md:h-auto rounded-[2rem] overflow-hidden shadow-2xl relative">
          <img src="/images/editorial.png" class="w-full h-full object-cover" alt="Modelo Maquiagem" />
          <div class="absolute inset-0 bg-stone-900/10"></div>
        </div>
        <div class="bg-[#1A1A1A] text-white flex flex-col justify-center items-start p-12 md:p-20 rounded-[2rem] shadow-2xl">
          <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] uppercase tracking-[0.2em] font-bold mb-8 text-white">A Nova Fórmula</span>
          <h2 class="text-5xl md:text-6xl font-serif font-light mb-8 leading-tight">Glow natural para<br>o dia a dia.</h2>
          <p class="font-light text-white/70 max-w-md mb-12 leading-relaxed text-base">
            Ingredientes que respeitam sua pele. Fórmulas limpas e de alta performance criadas para realçar sua beleza autêntica, sem mascarar. Texturas leves e aveludadas.
          </p>
          <a href="/catalogo" class="group flex items-center gap-4 text-xs font-bold uppercase tracking-widest border-b border-white/50 pb-2 hover:text-white hover:border-white transition-all">
            Descubra o Segredo
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:translate-x-3 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- As Seen On (Logos) -->
    <section class="py-20 border-t border-stone-200/50 dark:border-purple-900/20 bg-[#FAF9F6] dark:bg-[#0F0A1E] transition-colors">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <span class="text-[10px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-bold mb-12 block">A Excelência das Grandes Marcas</span>
        <div class="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 dark:opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
           <h3 class="text-2xl font-serif tracking-[0.2em] text-stone-900 dark:text-stone-100">DIOR</h3>
           <h3 class="text-2xl font-serif italic text-stone-900 dark:text-stone-100">CHANEL</h3>
           <h3 class="text-2xl font-serif font-bold tracking-widest text-stone-900 dark:text-stone-100">EUDORA</h3>
           <h3 class="text-2xl font-serif tracking-widest text-stone-900 dark:text-stone-100">LANCÔME</h3>
           <h3 class="text-2xl font-serif tracking-[0.2em] text-stone-900 dark:text-stone-100">O BOTICÁRIO</h3>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
