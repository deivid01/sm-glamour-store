<script setup>
import { RouterLink } from 'vue-router'
import { useCartStore } from '../stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cartStore = useCartStore()

const addToCart = (event) => {
    event.preventDefault()
    event.stopPropagation()
    cartStore.addToCart(props.product, 1)
}
</script>

<template>
  <RouterLink
    :to="{ name: 'produto_detalhe', params: { slug: product.slug || product.id } }"
    class="group relative bg-white border border-glamour-soft/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
  >
    <!-- Image Container with Aspect Ratio -->
    <div class="relative w-full pt-[100%] bg-stone-100 overflow-hidden">
      <!-- Tag / Badge -->
      <div v-if="product.isNew" class="absolute top-4 left-4 z-10 bg-glamour-primary text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
        Novo
      </div>
      
      <img 
        :src="product.image || 'https://via.placeholder.com/400x400/F9D6D9/D17A8C?text=SM+Glamour'" 
        :alt="`Imagem de ${product.name}`" 
        loading="lazy"
        class="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
      />
      
      <!-- Quick Add (Desktop Hover) -->
      <div class="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0 hidden md:block">
        <button @click.prevent="addToCart" class="w-full bg-white/90 backdrop-blur-md text-stone-800 font-medium py-3 rounded-xl shadow-lg hover:bg-glamour-gold hover:text-white transition-colors">
          Adicionar na Sacola
        </button>
      </div>
    </div>

    <!-- Product Details -->
    <div class="p-5 flex flex-col flex-grow">
      <div class="text-xs text-glamour-gold font-medium uppercase tracking-wider mb-2">{{ product.category }}</div>
      <h3 class="text-stone-800 font-medium text-lg mb-1 leading-tight group-hover:text-glamour-primary transition-colors flex-grow">
        {{ product.name }}
      </h3>
      
      <div class="mt-4 flex items-center justify-between">
        <div class="flex flex-col">
          <span v-if="product.oldPrice" class="text-stone-400 line-through text-sm">R$ {{ product.oldPrice.toFixed(2) }}</span>
          <span class="text-glamour-primary font-bold text-xl">R$ {{ product.price.toFixed(2) }}</span>
        </div>
        
        <!-- Mobile Add Button -->
        <button @click="addToCart" class="w-10 h-10 rounded-full bg-stone-50 text-glamour-primary border border-glamour-soft flex items-center justify-center md:hidden hover:bg-glamour-primary hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  </RouterLink>
</template>
