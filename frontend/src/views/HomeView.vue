<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import axios from 'axios'
import ProductCard from '../components/ProductCard.vue'

const router = useRouter()
const featuredProducts = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:8000/api/produtos/')
    // Pega os primeiros 4 produtos reais como destaque
    featuredProducts.value = response.data.slice(0, 4).map(p => ({
      id: p.id,
      name: p.nome,
      slug: p.slug,
      category: p.categoria_nome,
      price: parseFloat(p.preco),
      image: p.imagem_url || '/images/product_fallback.png',
      isNew: false
    }))
  } catch (error) {
    console.error('Erro loading home products:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="bg-[#FAF9F6] text-stone-900 overflow-hidden font-sans">
    
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
    <section class="py-20 px-4 max-w-7xl mx-auto">
      <div class="flex flex-nowrap overflow-x-auto gap-6 md:gap-12 hide-scrollbar snap-x pb-4 justify-start md:justify-center">
        <!-- Cat 1 -->
        <a href="/catalogo" class="flex flex-col items-center gap-4 group snap-center min-w-[100px] md:min-w-[120px]">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-stone-200 p-1 group-hover:border-black transition-colors duration-500 bg-white">
            <div class="w-full h-full rounded-full overflow-hidden">
               <img src="/images/skincare.png" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Skincare" />
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-600 group-hover:text-black transition-colors">Skincare</span>
        </a>
        <!-- Cat 2 -->
        <a href="/catalogo" class="flex flex-col items-center gap-4 group snap-center min-w-[100px] md:min-w-[120px]">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-stone-200 p-1 group-hover:border-black transition-colors duration-500 bg-white">
            <div class="w-full h-full rounded-full overflow-hidden">
               <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=500" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Perfumes" />
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-600 group-hover:text-black transition-colors">Perfumes</span>
        </a>
        <!-- Cat 3 -->
        <a href="/catalogo" class="flex flex-col items-center gap-4 group snap-center min-w-[100px] md:min-w-[120px]">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-stone-200 p-1 group-hover:border-black transition-colors duration-500 bg-white">
            <div class="w-full h-full rounded-full overflow-hidden">
               <img src="/images/makeup.png" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Make" />
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-600 group-hover:text-black transition-colors">Maquiagem</span>
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
        <div v-for="i in 4" :key="i" class="h-[450px] bg-stone-200 animate-pulse rounded-2xl"></div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        <ProductCard 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :product="product" 
        />
      </div>
      
      <div class="mt-16 text-center md:hidden">
         <a href="/catalogo" class="inline-block border border-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
          Ver Coleção Completa
        </a>
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
    <section class="py-20 border-t border-stone-200/50 bg-[#FAF9F6]">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <span class="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-12 block">A Excelência das Grandes Marcas</span>
        <div class="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
           <h3 class="text-2xl font-serif tracking-[0.2em] text-stone-900">DIOR</h3>
           <h3 class="text-2xl font-serif italic text-stone-900">CHANEL</h3>
           <h3 class="text-2xl font-serif font-bold tracking-widest text-stone-900">EUDORA</h3>
           <h3 class="text-2xl font-serif tracking-widest text-stone-900">LANCÔME</h3>
           <h3 class="text-2xl font-serif tracking-[0.2em] text-stone-900">O BOTICÁRIO</h3>
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
