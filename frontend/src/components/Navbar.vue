<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'

const isMenuOpen = ref(false)
const isCartOpen = ref(false)
const cartStore = useCartStore()
const router = useRouter()

const goToCheckout = () => {
    isCartOpen.value = false
    router.push('/checkout')
}
</script>

<template>
  <nav class="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-glamour-soft shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="flex items-center">
            <img src="/logos/1.jpeg" alt="SM Glamour Logo" class="h-12 w-auto object-contain hover:scale-105 transition-transform duration-300">
          </a>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:ml-6 md:flex md:space-x-8 items-center">
          <a href="/" class="text-stone-600 hover:text-glamour-primary transition-colors px-3 py-2 text-sm font-medium uppercase tracking-wider">Início</a>
          <a href="/catalogo" class="text-stone-600 hover:text-glamour-primary transition-colors px-3 py-2 text-sm font-medium uppercase tracking-wider">Catálogo</a>
          <a href="/sobre" class="text-stone-600 hover:text-glamour-primary transition-colors px-3 py-2 text-sm font-medium uppercase tracking-wider">Sobre Nós</a>
          
          <button @click="isCartOpen = true" class="relative p-2 text-stone-600 hover:text-glamour-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span v-if="cartStore.cartCount > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-glamour-gold rounded-full">{{ cartStore.cartCount }}</span>
          </button>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center md:hidden gap-4">
          <button @click="isCartOpen = true" class="relative p-2 text-stone-600 hover:text-glamour-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span v-if="cartStore.cartCount > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-glamour-gold rounded-full">{{ cartStore.cartCount }}</span>
          </button>
          
          <button @click="isMenuOpen = !isMenuOpen" class="inline-flex items-center justify-center p-2 rounded-md text-stone-600 hover:text-glamour-primary hover:bg-glamour-soft/30 focus:outline-none transition-colors">
            <svg v-if="!isMenuOpen" class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-show="isMenuOpen" class="md:hidden border-t border-glamour-soft bg-white/95 backdrop-blur-md absolute w-full shadow-lg">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-center">
        <a href="/" @click="isMenuOpen = false" class="block px-3 py-3 rounded-md text-base font-medium text-glamour-primary hover:bg-glamour-soft/50 transition-colors uppercase tracking-widest">Início</a>
        <a href="/catalogo" @click="isMenuOpen = false" class="block px-3 py-3 rounded-md text-base font-medium text-stone-600 hover:text-glamour-primary hover:bg-glamour-soft/50 transition-colors uppercase tracking-widest">Catálogo</a>
        <a href="/sobre" @click="isMenuOpen = false" class="block px-3 py-3 rounded-md text-base font-medium text-stone-600 hover:text-glamour-primary hover:bg-glamour-soft/50 transition-colors uppercase tracking-widest">Sobre Nós</a>
      </div>
    </div>

    <!-- Side Cart Overlay -->
    <div v-show="isCartOpen" class="fixed inset-0 z-[200] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" @click="isCartOpen = false"></div>

        <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div class="pointer-events-auto w-screen max-w-md">
            <div class="flex h-full flex-col bg-white shadow-2xl">
              <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6 hide-scrollbar">
                <div class="flex items-start justify-between">
                  <h2 class="text-xl font-serif text-stone-900" id="slide-over-title">Sacola de Compras</h2>
                  <div class="ml-3 flex h-7 items-center">
                    <button type="button" class="relative -m-2 p-2 text-stone-400 hover:text-stone-500 transition-colors" @click="isCartOpen = false">
                      <span class="absolute -inset-0.5"></span>
                      <span class="sr-only">Fechar painel</span>
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="mt-10">
                  <div v-if="cartStore.cartCount === 0" class="text-center py-10">
                    <div class="text-stone-300 mb-4 inline-block">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-16 h-16">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    </div>
                    <p class="text-stone-500 font-light text-sm">Sua sacola parece estar vazia.</p>
                  </div>
                  
                  <div class="flow-root" v-else>
                    <ul role="list" class="-my-6 divide-y divide-stone-200">
                      <li v-for="item in cartStore.items" :key="item.id" class="flex py-6">
                        <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
                          <img :src="item.image" :alt="item.name" class="h-full w-full object-cover object-center">
                        </div>

                        <div class="ml-4 flex flex-1 flex-col">
                          <div>
                            <div class="flex justify-between text-sm md:text-base font-medium text-stone-900">
                              <h3 class="line-clamp-2 pr-4"><a href="#">{{ item.name }}</a></h3>
                              <p class="ml-4 whitespace-nowrap">R$ {{ (item.price * item.quantity).toFixed(2) }}</p>
                            </div>
                            <p class="mt-1 text-xs text-glamour-gold uppercase tracking-wider">{{ item.category }}</p>
                          </div>
                          <div class="flex flex-1 items-end justify-between text-sm">
                            <p class="text-stone-500">Qtd {{ item.quantity }}</p>

                            <div class="flex">
                              <button @click="cartStore.removeFromCart(item.id)" type="button" class="font-medium text-glamour-primary hover:text-stone-900 transition-colors">Excluir</button>
                            </div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="border-t border-stone-200 px-4 py-6 sm:px-6 bg-stone-50">
                <div class="flex justify-between text-base font-medium text-stone-900 mb-2">
                  <p>Subtotal</p>
                  <p>R$ {{ cartStore.cartTotal.toFixed(2) }}</p>
                </div>
                <p class="mt-0.5 text-xs text-stone-500">Frete calculado no momento do pagamento.</p>
                <div class="mt-6">
                  <button @click="goToCheckout" :disabled="cartStore.cartCount === 0" class="flex w-full items-center justify-center rounded-full border border-transparent bg-glamour-primary px-6 py-4 text-sm font-bold tracking-widest uppercase text-white shadow-xl shadow-glamour-primary/20 hover:bg-stone-900 disabled:bg-stone-300 disabled:shadow-none transition-all duration-300">
                    Finalizar Compra
                  </button>
                </div>
                <div class="mt-6 flex justify-center text-center text-sm text-stone-500 gap-1">
                  <p>ou</p>
                  <button type="button" class="font-medium text-glamour-primary hover:text-stone-900 transition-colors" @click="isCartOpen = false">
                     Continuar Comprando<span aria-hidden="true"> &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </nav>
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
