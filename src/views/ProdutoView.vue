<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const quantity = ref(1)
const loading = ref(true)
const product = ref(null)
const activeImage = ref('')
const cep = ref('')
const shippingOptions = ref([])
const loadingShipping = ref(false)
const shippingError = ref('')

const fetchProduct = async () => {
  try {
    const response = await axios.get(`/api/produtos/${route.params.slug}/`)
    product.value = {
      id: response.data.id,
      name: response.data.nome,
      category: response.data.categoria?.nome || response.data.categoria_nome || 'Sem categoria',
      price: parseFloat(response.data.preco),
      description: response.data.descricao,
      image: response.data.imagem_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80',
      gallery: [response.data.imagem_url].filter(Boolean),
      isNew: false
    }
    activeImage.value = product.value.image
    if (product.value.gallery.length === 0) {
        product.value.gallery.push(product.value.image)
    }
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
  } finally {
    loading.value = false
  }
}

const calculateShipping = async () => {
  const normalizedCep = cep.value.replace(/\D/g, '')
  if (!normalizedCep || normalizedCep.length < 8) {
    shippingError.value = 'Informe um CEP válido com 8 dígitos.'
    return
  }

  loadingShipping.value = true
  shippingError.value = ''

  try {
    const response = await axios.post('/api/integrations/shipping/calculate/', {
      to_postal_code: normalizedCep,
      products: [{ id: product.value.id, quantity: quantity.value }]
    })

    shippingOptions.value = (response.data || []).map(opt => ({
      id: opt.id,
      nome: opt.nome || opt.name || 'Frete',
      valor: opt.valor || opt.price || '0.00',
      prazo_dias: opt.prazo_dias || opt.delivery_time || 0
    }))
  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    shippingError.value = 'Erro ao calcular frete. Verifique o CEP.'
  } finally {
    loadingShipping.value = false
  }
}

onMounted(() => {
  fetchProduct()
})

const decrementQuantity = () => {
    if (quantity.value > 1) quantity.value--
}

const formatText = (text) => text ? text.split('\n') : []

const addToCartAndCheckout = () => {
    cartStore.addToCart(product.value, quantity.value)
    router.push({ name: 'checkout' })
}
</script>

<template>
  <div class="bg-stone-50 min-h-screen py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-glamour-primary"></div>
      </div>

      <template v-else-if="product">
        <!-- Breadcrumb -->
        <nav class="flex text-sm text-stone-500 mb-8 font-light" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
                <RouterLink to="/" class="hover:text-glamour-primary transition-colors">Início</RouterLink>
            </li>
            <li>
                <div class="flex items-center">
                <svg class="w-3 h-3 text-stone-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <RouterLink to="/catalogo" class="hover:text-glamour-primary ml-1 md:ml-2 transition-colors">Catálogo</RouterLink>
                </div>
            </li>
            <li aria-current="page">
                <div class="flex items-center">
                <svg class="w-3 h-3 text-stone-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span class="text-stone-700 ml-1 md:ml-2">{{ product.name }}</span>
                </div>
            </li>
            </ol>
        </nav>

        <div class="bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-glamour-soft/30 flex flex-col lg:flex-row gap-12">
            
            <!-- Galeria de Imagens -->
            <div class="w-full lg:w-1/2 flex gap-4">
            
            <!-- Miniaturas -->
            <div v-if="product.gallery.length > 1" class="flex flex-col gap-4 w-20 flex-shrink-0">
                <button 
                    v-for="(img, idx) in product.gallery" 
                    :key="idx"
                    @click="activeImage = img"
                    :class="[
                        'relative pt-[100%] rounded-xl overflow-hidden border-2 transition-all',
                        activeImage === img ? 'border-glamour-primary shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    ]"
                >
                <img :src="img" class="absolute inset-0 w-full h-full object-cover" />
                </button>
            </div>

            <!-- Imagem Principal -->
            <div class="w-full relative pt-[120%] bg-stone-100 rounded-2xl overflow-hidden">
                <img :src="activeImage" :alt="product.name" class="absolute inset-0 w-full h-full object-cover" />
                
                <!-- Badges -->
                <div v-if="product.isNew" class="absolute top-4 left-4 bg-glamour-primary text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                Novo Lançamento
                </div>
            </div>
            </div>

            <!-- Detalhes do Produto & Ações -->
            <div class="w-full lg:w-1/2 flex flex-col justify-center">
            <span class="text-glamour-gold font-bold tracking-widest uppercase text-xs mb-3 block">
                {{ product.category }}
            </span>
            <h1 class="text-3xl md:text-5xl font-serif text-stone-900 mb-4 leading-tight">
                {{ product.name }}
            </h1>
            
            <div class="flex items-end gap-4 mb-8">
                <div class="flex flex-col">
                    <span class="text-4xl text-glamour-primary font-bold">R$ {{ product.price.toFixed(2) }}</span>
                </div>
                <div class="bg-glamour-soft/50 text-glamour-primary text-xs font-bold px-2 py-1 rounded select-none mb-1">
                    Até 3x de R$ {{ (product.price / 3).toFixed(2) }} s/ juros
                </div>
            </div>

            <!-- Formulário do Carrinho -->
            <div class="border-y border-glamour-soft py-8 mb-8">
                <div class="flex flex-col sm:flex-row gap-4">
                <!-- Seletor de Quantidade -->
                <div class="flex border border-stone-200 rounded-full h-14 bg-white select-none items-center justify-between w-full sm:w-1/3 px-2">
                    <button @click="decrementQuantity" class="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-glamour-primary hover:bg-glamour-soft/30 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" /></svg>
                    </button>
                    <span class="font-medium text-lg w-8 text-center">{{ quantity }}</span>
                    <button @click="quantity++" class="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-glamour-primary hover:bg-glamour-soft/30 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                </div>

                <!-- Action Botão -->
                <button @click="addToCartAndCheckout" class="flex-grow bg-stone-900 hover:bg-glamour-primary text-white h-14 rounded-full font-medium tracking-widest uppercase text-sm shadow-xl shadow-stone-900/20 transition-all duration-300 flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Adicionar à Sacola
                </button>
                </div>
                
                <!-- Calculadora de Frete Real -->
                <div class="mt-6 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div class="flex items-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-glamour-gold"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                    <div class="flex-grow">
                        <span class="block text-sm font-medium text-stone-800">Cálculo de Frete (Olist/Correios)</span>
                        <div class="flex mt-1">
                            <input v-model="cep" type="text" placeholder="Seu CEP..." class="w-32 bg-white border border-stone-200 text-sm px-3 py-1.5 focus:outline-none focus:border-glamour-primary rounded-l-lg h-9">
                            <button @click="calculateShipping" :disabled="loadingShipping" class="bg-glamour-soft text-glamour-primary font-bold text-xs px-4 rounded-r-lg hover:bg-glamour-primary hover:text-white transition-colors h-9">
                                <span v-if="loadingShipping">...</span>
                                <span v-else>OK</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Resultados do Frete -->
                <div v-if="shippingOptions.length > 0" class="mt-4 space-y-2">
                    <div v-for="opt in shippingOptions" :key="opt.id" class="flex justify-between text-sm bg-white p-2 rounded-lg border border-glamour-soft/30">
                        <span class="text-stone-700 font-medium">{{ opt.nome }}</span>
                        <div class="text-right">
                            <span class="block font-bold text-glamour-primary">R$ {{ opt.valor }}</span>
                            <span class="text-[10px] text-stone-400 capitalize">Prazo: {{ opt.prazo_dias }} dias</span>
                        </div>
                    </div>
                </div>
                <p v-else-if="shippingError" class="mt-3 text-xs text-red-500">{{ shippingError }}</p>
                </div>
            </div>

            <!-- Descrição -->
            <div>
                <h3 class="text-stone-900 font-serif text-xl mb-4">Sobre o Produto</h3>
                <div class="text-stone-600 font-light leading-relaxed space-y-4">
                <p v-for="(p, i) in formatText(product.description)" :key="i">{{ p }}</p>
                </div>
            </div>

            </div>
        </div>
      </template>

      <div v-else class="text-center py-20">
          <h2 class="text-2xl font-serif">Produto não encontrado.</h2>
          <RouterLink to="/catalogo" class="text-glamour-primary mt-4 inline-block">Voltar ao catálogo</RouterLink>
      </div>

    </div>
  </div>
</template>
