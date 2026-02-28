<script setup>
import { useCartStore } from '../stores/cart'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const cartStore = useCartStore()
const router = useRouter()

const form = ref({
    email: '',
    nome: '',
    cpf: '',
    cep: '',
    endereco: '',
    numero: ''
})

const shippingOptions = ref([])
const selectedShipping = ref(null)
const loadingShipping = ref(false)
const loadingCheckout = ref(false)

const calculateShipping = async () => {
    if (form.value.cep.length < 8) return
    loadingShipping.value = true
    try {
        const response = await axios.post('http://localhost:8000/api/integrations/shipping/calculate/', {
            cep: form.value.cep,
            produtos: cartStore.items.map(i => ({ id: i.id, quantidade: i.quantity }))
        })
        
        // Tratar resposta que pode ser array ou objeto de fallback
        if (Array.isArray(response.data)) {
            shippingOptions.value = response.data
        } else {
            // Transformar o fallback (pac/sedex) em array se necessário
            shippingOptions.value = Object.keys(response.data).map(key => ({
                id: key,
                nome: key.toUpperCase(),
                valor: response.data[key].valor,
                prazo_dias: response.data[key].prazo_dias
            }))
        }
    } catch (error) {
        console.error('Erro frete checkout:', error)
    } finally {
        loadingShipping.value = false
    }
}

// Observar CEP para calcular frete automaticamente
watch(() => form.value.cep, (newCep) => {
    if (newCep.length >= 8) {
        calculateShipping()
    }
})

const shippingValue = computed(() => {
    return selectedShipping.value ? parseFloat(selectedShipping.value.valor) : 0
})

const totalWithShipping = computed(() => {
    return cartStore.cartTotal + shippingValue.value
})

const handleCheckout = async () => {
    if (!selectedShipping.value) {
        alert("Por favor, selecione uma opção de frete.")
        return
    }
    
    loadingCheckout.value = true
    try {
        // Aqui enviaríamos para um endpoint do Django que cria o pedido e envia para a Olist
        // Por enquanto, simulamos o sucesso após a integração de frete
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        alert("Pedido recebido! Integrando com Olist ERP...")
        cartStore.clearCart()
        router.push('/')
    } catch (error) {
        alert("Erro ao processar pedido.")
    } finally {
        loadingCheckout.value = false
    }
}
</script>

<template>
  <div class="bg-stone-50 min-h-screen py-10 md:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div v-if="cartStore.cartCount === 0" class="text-center py-20 bg-white rounded-3xl border border-glamour-soft/30 shadow-sm max-w-2xl mx-auto">
        <h2 class="text-3xl font-serif text-stone-800 mb-4">Sua sacola está vazia.</h2>
        <p class="text-stone-500 font-light mb-8">Adicione os produtos de autocuidado ideais para você e eles aparecerão aqui.</p>
        <RouterLink to="/catalogo" class="bg-glamour-primary hover:bg-stone-900 text-white px-8 py-3 rounded-full font-medium tracking-widest uppercase text-sm shadow-xl shadow-glamour-primary/30 transition-all duration-300">
            Ir para Catálogo
        </RouterLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <!-- Formulário Checkout -->
        <div class="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-stone-200">
            <h2 class="text-2xl font-serif text-stone-900 mb-8 border-b border-glamour-soft pb-4">Finalize seu Pedido</h2>
            
            <form @submit.prevent="handleCheckout" class="space-y-8">
                
                <!-- Dados Pessoais -->
                <section>
                    <h3 class="text-glamour-gold font-bold tracking-widest uppercase text-xs mb-4">1. Dados Pessoais</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="col-span-1 md:col-span-2">
                            <label class="block text-sm font-medium text-stone-700 mb-1">E-mail</label>
                            <input v-model="form.email" type="email" required class="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-stone-700 mb-1">Nome Completo</label>
                            <input v-model="form.nome" type="text" required class="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-stone-700 mb-1">CPF</label>
                            <input v-model="form.cpf" type="text" required class="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                    </div>
                </section>

                <!-- Entrega -->
                <section>
                    <h3 class="text-glamour-gold font-bold tracking-widest uppercase text-xs mb-4">2. Endereço & Frete</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div class="col-span-1">
                            <label class="block text-sm font-medium text-stone-700 mb-1">CEP</label>
                            <input v-model="form.cep" type="text" required class="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                        <div class="col-span-1 sm:col-span-2">
                            <label class="block text-sm font-medium text-stone-700 mb-1">Endereço</label>
                            <input v-model="form.endereco" type="text" required class="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                    </div>

                    <!-- Opções de Frete -->
                    <div v-if="loadingShipping" class="flex items-center gap-3 text-stone-400 text-sm">
                        <div class="animate-spin h-4 w-4 border-2 border-glamour-primary border-t-transparent rounded-full"></div>
                        Calculando frete real...
                    </div>
                    <div v-else-if="shippingOptions.length > 0" class="space-y-3">
                        <label v-for="opt in shippingOptions" :key="opt.id" class="flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:bg-stone-50" :class="selectedShipping?.id === opt.id ? 'border-glamour-primary bg-glamour-soft/10 ring-1 ring-glamour-primary' : 'border-stone-100'">
                            <input type="radio" :value="opt" v-model="selectedShipping" class="accent-glamour-primary h-4 w-4">
                            <div class="ml-4 flex-grow">
                                <span class="block font-medium text-stone-800">{{ opt.nome }}</span>
                                <span class="text-xs text-stone-500">Entrega em até {{ opt.prazo_dias }} dias úteis</span>
                            </div>
                            <span class="font-bold text-glamour-primary">R$ {{ opt.valor }}</span>
                        </label>
                    </div>
                </section>

                <button :disabled="loadingCheckout" type="submit" class="w-full bg-glamour-primary hover:bg-stone-900 disabled:bg-stone-400 text-white h-14 rounded-xl font-medium tracking-widest uppercase text-sm shadow-xl shadow-glamour-primary/20 transition-all duration-300 select-none">
                    <span v-if="loadingCheckout">Processando...</span>
                    <span v-else>Finalizar Pedido R$ {{ totalWithShipping.toFixed(2) }}</span>
                </button>
            </form>
        </div>

        <!-- Resumo do Pedido -->
        <div class="lg:col-span-5 relative">
            <div class="bg-stone-100 p-8 md:p-10 rounded-3xl sticky top-24 border border-stone-200">
                <h3 class="text-xl font-serif text-stone-900 mb-6 border-b border-stone-300 pb-4">Resumo da Sacola</h3>
                
                <div class="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2 hide-scrollbar">
                    <div v-for="item in cartStore.items" :key="item.id" class="flex gap-4 items-center">
                        <div class="w-16 h-16 rounded-lg bg-white overflow-hidden border border-stone-200 flex-shrink-0">
                            <img :src="item.image" :alt="item.name" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-grow">
                            <h4 class="text-sm font-medium text-stone-800 line-clamp-2">{{ item.name }}</h4>
                            <div class="text-xs text-stone-500 mt-1">Qtd: {{ item.quantity }}</div>
                        </div>
                        <div class="font-bold text-stone-900 text-sm whitespace-nowrap">
                            R$ {{ (item.price * item.quantity).toFixed(2) }}
                        </div>
                        <button @click="cartStore.removeFromCart(item.id)" class="text-stone-400 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </div>
                </div>

                <div class="border-t border-stone-300 pt-6 space-y-3">
                    <div class="flex justify-between text-sm text-stone-600">
                        <span>Subtotal</span>
                        <span>R$ {{ cartStore.cartTotal.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between text-sm transition-all duration-300" :class="selectedShipping ? 'text-stone-900 font-medium' : 'text-stone-400'">
                        <span>Frete</span>
                        <span v-if="selectedShipping">R$ {{ shippingValue.toFixed(2) }}</span>
                        <span v-else class="text-xs uppercase tracking-wider">Aguardando CEP...</span>
                    </div>
                    <div class="flex justify-between text-xl font-bold text-stone-900 pt-4 border-t border-stone-300">
                        <span>Total</span>
                        <span>R$ {{ totalWithShipping.toFixed(2) }}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
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
