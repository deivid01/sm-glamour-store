<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import ProductCard from '../components/ProductCard.vue'

const allProducts = ref([])
const categories = ref(['Todas'])
const searchQuery = ref('')
const selectedCategory = ref('Todas')
const loading = ref(true)

const fetchProducts = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/produtos/`)
    allProducts.value = response.data.map(p => ({
      id: p.id,
      name: p.nome,
      slug: p.slug,
      category: p.categoria_nome,
      price: parseFloat(p.preco),
      image: p.imagem_url || '/images/product_fallback.png',
      isNew: false // Poderia ser derivado da data de criação
    }))
    
    // Extrair categorias únicas
    const uniqueCats = ['Todas', ...new Set(allProducts.value.map(p => p.category))]
    categories.value = uniqueCats
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

const filteredProducts = computed(() => {
  return allProducts.value.filter(product => {
    const matchesCategory = selectedCategory.value === 'Todas' || product.category === selectedCategory.value
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  })
})
</script>

<template>
  <div class="bg-stone-50 min-h-screen py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb & Header -->
      <div class="mb-12 border-b border-glamour-soft pb-8">
        <h1 class="text-4xl md:text-5xl font-serif text-stone-900 mb-4 tracking-wide">
          Catálogo <span class="text-glamour-primary italic font-light">Completo</span>
        </h1>
        <p class="text-stone-600 font-light max-w-2xl text-lg">
          Produtos reais sincronizados diretamente da nossa curadoria.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-glamour-primary"></div>
      </div>

      <template v-else>
        <!-- Filters & Search -->
        <div class="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          
          <!-- Search bar -->
          <div class="w-full md:w-1/3 relative">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Buscar produtos..." 
              class="w-full bg-white border border-glamour-soft/50 rounded-full px-5 py-3 pl-12 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all shadow-sm"
            >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          <!-- Category Pills -->
          <div class="w-full md:w-auto overflow-x-auto pb-4 md:pb-0 hide-scrollbar flex gap-2">
            <button 
              v-for="cat in categories" 
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium tracking-wider uppercase transition-all duration-300',
                selectedCategory === cat 
                  ? 'bg-glamour-primary text-white shadow-md shadow-glamour-primary/20' 
                  : 'bg-white text-stone-600 border border-glamour-soft hover:border-glamour-primary hover:text-glamour-primary'
              ]"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Grid de Resultados -->
        <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <ProductCard 
            v-for="product in filteredProducts" 
            :key="product.id" 
            :product="product" 
          />
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-20 bg-white rounded-3xl border border-glamour-soft/30 shadow-sm">
          <div class="w-20 h-20 bg-glamour-soft rounded-full flex items-center justify-center mx-auto mb-6 text-glamour-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-2xl font-serif text-stone-800 mb-2">Nenhum produto encontrado</h3>
          <p class="text-stone-500 font-light max-w-md mx-auto">Não encontramos resultados para a sua busca na categoria selecionada. Tente outros termos.</p>
          <button @click="searchQuery = ''; selectedCategory = 'Todas'" class="mt-6 text-glamour-primary hover:text-glamour-gold font-medium uppercase tracking-widest text-sm border-b border-glamour-primary pb-1 transition-colors">
            Limpar Filtros
          </button>
        </div>
      </template>

    </div>
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
