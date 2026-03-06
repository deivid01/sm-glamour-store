<script setup>
import { useCartStore } from '../stores/cart'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import axios from 'axios'

const cartStore = useCartStore()
const router = useRouter()

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY ?? ''

const form = ref({
    email: '',
    nome: '',
    cpf: '',
    cep: '',
    endereco: '',
    numero: ''
})

const step = ref(1) // 1=info, 2=payment
const shippingOptions = ref([])
const selectedShipping = ref(null)
const loadingShipping = ref(false)
const loadingCheckout = ref(false)
const mpReady = ref(false)
let brickController = null

const calculateShipping = async () => {
    const normalizedCep = form.value.cep.replace(/\D/g, '')
    if (normalizedCep.length < 8) return

    loadingShipping.value = true
    try {
        const response = await axios.post('/api/integrations/shipping/calculate/', {
            to_postal_code: normalizedCep,
            products: cartStore.items.map(i => ({ id: i.id, quantity: i.quantity }))
        })

        if (Array.isArray(response.data)) {
            shippingOptions.value = response.data.map(opt => ({
                id: opt.id,
                nome: opt.nome || opt.name || 'Frete',
                valor: opt.valor || opt.price || '0.00',
                prazo_dias: opt.prazo_dias || opt.delivery_time || 0
            }))
        } else {
            shippingOptions.value = Object.keys(response.data || {}).map(key => ({
                id: key,
                nome: key.toUpperCase(),
                valor: response.data[key].valor,
                prazo_dias: response.data[key].prazo_dias
            }))
        }
        selectedShipping.value = null
    } catch (error) {
        console.error('Erro frete checkout:', error)
    } finally {
        loadingShipping.value = false
    }
}

watch(() => form.value.cep, (newCep) => {
    if (newCep.replace(/\D/g, '').length >= 8) calculateShipping()
})

const shippingValue = computed(() => selectedShipping.value ? parseFloat(selectedShipping.value.valor) : 0)
const totalWithShipping = computed(() => cartStore.cartTotal + shippingValue.value)

const goToPayment = () => {
    if (!form.value.email || !form.value.nome || !form.value.cep || !form.value.endereco) {
        alert('Por favor, preencha todos os campos obrigatórios.')
        return
    }
    if (!selectedShipping.value) {
        alert('Por favor, selecione uma opção de frete.')
        return
    }
    step.value = 2
}

// Load Mercado Pago SDK and mount the Payment Brick
const mountMpBrick = async () => {
    const container = document.getElementById('payment-brick-container')
    if (!container || !MP_PUBLIC_KEY) return

    // Dynamically load the MP JS SDK
    if (!window.MercadoPago) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://sdk.mercadopago.com/js/v2'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
        })
    }

    try {
        // Create MP preference on the backend
        const { data: prefData } = await axios.post('/api/pagamentos/preferencia', {
            items: cartStore.items.map(item => ({
                id: String(item.id),
                title: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                currency_id: 'BRL'
            })),
            payer: {
                name: form.value.nome,
                email: form.value.email
            },
            shipping: {
                cost: shippingValue.value
            }
        })

        const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' })
        const bricks = mp.bricks()

        brickController = await bricks.create('payment', 'payment-brick-container', {
            initialization: {
                amount: totalWithShipping.value,
                preferenceId: prefData.preference_id,
                payer: {
                    firstName: form.value.nome.split(' ')[0],
                    lastName: form.value.nome.split(' ').slice(1).join(' '),
                    email: form.value.email
                }
            },
            customization: {
                paymentMethods: {
                    creditCard: 'all',
                    debitCard: 'all',
                    ticket: 'all',
                    bankTransfer: 'all',
                    atm: 'all'
                },
                visual: { style: { theme: 'default' } }
            },
            callbacks: {
                onReady: () => { mpReady.value = true },
                onSubmit: async ({ selectedPaymentMethod, formData }) => {
                    loadingCheckout.value = true
                    try {
                        const response = await axios.post('/api/pagamentos/processar', {
                            ...formData,
                            payer: {
                                ...formData.payer,
                                email: form.value.email,
                                identification: {
                                    type: 'CPF',
                                    number: form.value.cpf.replace(/\D/g, '')
                                }
                            }
                        })

                        if (response.data.status === 'approved') {
                            cartStore.clearCart()
                            router.push('/checkout/sucesso')
                        } else if (response.data.status === 'pending') {
                            cartStore.clearCart()
                            router.push('/checkout/pendente')
                        } else {
                            alert('Pagamento não aprovado. Verifique os dados e tente novamente.')
                        }
                    } catch (err) {
                        console.error('Payment error:', err)
                        alert('Erro ao processar pagamento. Tente novamente.')
                    } finally {
                        loadingCheckout.value = false
                    }
                },
                onError: (error) => {
                    console.error('MP Brick error:', error)
                }
            }
        })
    } catch (err) {
        console.error('Failed to mount MP brick:', err)
    }
}

watch(step, async (newStep) => {
    if (newStep === 2) {
        await new Promise(r => setTimeout(r, 100)) // wait for DOM
        await mountMpBrick()
    }
})

onBeforeUnmount(() => {
    if (brickController) brickController.unmount()
})
</script>

<template>
  <div class="bg-stone-50 dark:bg-[#0F0A1E] min-h-screen py-10 md:py-16 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Empty cart -->
      <div v-if="cartStore.cartCount === 0" class="text-center py-20 bg-white dark:bg-[#1a0a2e] rounded-3xl border border-glamour-soft/30 dark:border-purple-900/30 shadow-sm max-w-2xl mx-auto">
        <h2 class="text-3xl font-serif text-stone-800 dark:text-stone-100 mb-4">Sua sacola está vazia.</h2>
        <p class="text-stone-500 dark:text-stone-400 font-light mb-8">Adicione produtos e eles aparecerão aqui.</p>
        <RouterLink to="/catalogo" class="bg-glamour-primary hover:bg-stone-900 text-white px-8 py-3 rounded-full font-medium tracking-widest uppercase text-sm shadow-xl shadow-glamour-primary/30 transition-all duration-300">
            Ir para Catálogo
        </RouterLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10">

        <!-- STEP INDICATOR -->
        <div class="lg:col-span-12 flex items-center gap-3 mb-2">
          <div class="flex items-center gap-2 text-sm font-medium" :class="step >= 1 ? 'text-glamour-primary' : 'text-stone-400'">
            <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" :class="step >= 1 ? 'bg-glamour-primary text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'">1</span>
            Seus Dados
          </div>
          <div class="flex-1 h-px bg-stone-200 dark:bg-stone-700"></div>
          <div class="flex items-center gap-2 text-sm font-medium" :class="step >= 2 ? 'text-glamour-primary' : 'text-stone-400'">
            <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" :class="step >= 2 ? 'bg-glamour-primary text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'">2</span>
            Pagamento
          </div>
        </div>

        <!-- STEP 1: INFO FORM -->
        <div v-show="step === 1" class="lg:col-span-7 bg-white dark:bg-[#1a0a2e] p-8 md:p-10 rounded-3xl shadow-sm border border-stone-200 dark:border-purple-900/30">
            <h2 class="text-2xl font-serif text-stone-900 dark:text-stone-100 mb-8 border-b border-glamour-soft dark:border-purple-900/30 pb-4">Finalize seu Pedido</h2>

            <form @submit.prevent="goToPayment" class="space-y-8">
                <!-- Dados Pessoais -->
                <section>
                    <h3 class="text-glamour-gold font-bold tracking-widest uppercase text-xs mb-4">1. Dados Pessoais</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="col-span-1 md:col-span-2">
                            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">E-mail *</label>
                            <input v-model="form.email" type="email" required class="w-full bg-stone-50 dark:bg-[#110722] border border-stone-200 dark:border-purple-900/50 text-stone-900 dark:text-stone-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nome Completo *</label>
                            <input v-model="form.nome" type="text" required class="w-full bg-stone-50 dark:bg-[#110722] border border-stone-200 dark:border-purple-900/50 text-stone-900 dark:text-stone-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">CPF *</label>
                            <input v-model="form.cpf" type="text" required maxlength="14" placeholder="000.000.000-00" class="w-full bg-stone-50 dark:bg-[#110722] border border-stone-200 dark:border-purple-900/50 text-stone-900 dark:text-stone-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                    </div>
                </section>

                <!-- Endereço & Frete -->
                <section>
                    <h3 class="text-glamour-gold font-bold tracking-widest uppercase text-xs mb-4">2. Endereço & Frete</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div class="col-span-1">
                            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">CEP *</label>
                            <input v-model="form.cep" type="text" required maxlength="9" placeholder="00000-000" class="w-full bg-stone-50 dark:bg-[#110722] border border-stone-200 dark:border-purple-900/50 text-stone-900 dark:text-stone-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                        <div class="col-span-1 sm:col-span-2">
                            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Endereço *</label>
                            <input v-model="form.endereco" type="text" required class="w-full bg-stone-50 dark:bg-[#110722] border border-stone-200 dark:border-purple-900/50 text-stone-900 dark:text-stone-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-glamour-primary focus:ring-1 focus:ring-glamour-primary transition-all">
                        </div>
                    </div>

                    <div v-if="loadingShipping" class="flex items-center gap-3 text-stone-400 text-sm">
                        <div class="animate-spin h-4 w-4 border-2 border-glamour-primary border-t-transparent rounded-full"></div>
                        Calculando frete...
                    </div>
                    <div v-else-if="shippingOptions.length > 0" class="space-y-3">
                        <label v-for="opt in shippingOptions" :key="opt.id" class="flex items-center p-4 border rounded-xl cursor-pointer transition-all" :class="selectedShipping?.id === opt.id ? 'border-glamour-primary bg-glamour-soft/10 dark:bg-glamour-primary/10 ring-1 ring-glamour-primary' : 'border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/30'">
                            <input type="radio" :value="opt" v-model="selectedShipping" class="accent-glamour-primary h-4 w-4">
                            <div class="ml-4 flex-grow">
                                <span class="block font-medium text-stone-800 dark:text-stone-200">{{ opt.nome }}</span>
                                <span class="text-xs text-stone-500 dark:text-stone-400">Entrega em até {{ opt.prazo_dias }} dias úteis</span>
                            </div>
                            <span class="font-bold text-glamour-primary">R$ {{ opt.valor }}</span>
                        </label>
                    </div>
                </section>

                <button type="submit" class="w-full bg-glamour-primary hover:brightness-110 text-white h-14 rounded-xl font-bold tracking-widest uppercase text-sm shadow-xl shadow-glamour-primary/20 transition-all duration-300 flex items-center justify-center gap-2">
                    Continuar para Pagamento
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </form>
        </div>

        <!-- STEP 2: MP PAYMENT BRICK -->
        <div v-show="step === 2" class="lg:col-span-7">
            <div class="bg-white dark:bg-[#1a0a2e] p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200 dark:border-purple-900/30 mb-4">
                <div class="flex items-center justify-between mb-6 border-b border-stone-100 dark:border-purple-900/20 pb-4">
                    <h2 class="text-xl font-serif text-stone-900 dark:text-stone-100">Escolha como pagar</h2>
                    <button @click="step = 1" class="text-xs text-glamour-primary hover:underline">← Voltar</button>
                </div>

                <!-- MP Payment Brick mounts here -->
                <div v-if="!mpReady" class="flex items-center justify-center py-16 gap-3 text-stone-400">
                    <div class="animate-spin h-6 w-6 border-2 border-glamour-primary border-t-transparent rounded-full"></div>
                    <span>Carregando opcões de pagamento...</span>
                </div>
                <div id="payment-brick-container"></div>

                <div v-if="loadingCheckout" class="flex items-center justify-center gap-3 mt-4 text-stone-500 dark:text-stone-400 text-sm">
                    <div class="animate-spin h-5 w-5 border-2 border-glamour-primary border-t-transparent rounded-full"></div>
                    Processando pagamento...
                </div>
            </div>

            <!-- Security badges -->
            <div class="flex items-center justify-center gap-6 text-stone-400 dark:text-stone-600 text-xs">
                <span class="flex items-center gap-1">🔒 Conexão segura SSL</span>
                <span class="flex items-center gap-1">🏦 Powered by Mercado Pago</span>
                <span class="flex items-center gap-1">✅ PIX · Cartão · Boleto</span>
            </div>
        </div>

        <!-- ORDER SUMMARY SIDEBAR -->
        <div class="lg:col-span-5 relative">
            <div class="bg-stone-100 dark:bg-[#130827] p-8 md:p-10 rounded-3xl sticky top-24 border border-stone-200 dark:border-purple-900/30 transition-colors">
                <h3 class="text-xl font-serif text-stone-900 dark:text-stone-100 mb-6 border-b border-stone-300 dark:border-stone-700 pb-4">Resumo da Sacola</h3>

                <div class="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2 hide-scrollbar">
                    <div v-for="item in cartStore.items" :key="item.id" class="flex gap-4 items-center">
                        <div class="w-16 h-16 rounded-lg bg-white dark:bg-stone-800 overflow-hidden border border-stone-200 dark:border-stone-700 flex-shrink-0">
                            <img :src="item.image" :alt="item.name" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-grow">
                            <h4 class="text-sm font-medium text-stone-800 dark:text-stone-200 line-clamp-2">{{ item.name }}</h4>
                            <div class="text-xs text-stone-500 dark:text-stone-400 mt-1">Qtd: {{ item.quantity }}</div>
                        </div>
                        <div class="font-bold text-stone-900 dark:text-stone-100 text-sm whitespace-nowrap">
                            R$ {{ (item.price * item.quantity).toFixed(2) }}
                        </div>
                        <button @click="cartStore.removeFromCart(item.id)" class="text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </div>
                </div>

                <div class="border-t border-stone-300 dark:border-stone-700 pt-6 space-y-3">
                    <div class="flex justify-between text-sm text-stone-600 dark:text-stone-400">
                        <span>Subtotal</span>
                        <span>R$ {{ cartStore.cartTotal.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between text-sm transition-all duration-300" :class="selectedShipping ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-400'">
                        <span>Frete</span>
                        <span v-if="selectedShipping">R$ {{ shippingValue.toFixed(2) }}</span>
                        <span v-else class="text-xs uppercase tracking-wider">Aguardando CEP...</span>
                    </div>
                    <div class="flex justify-between text-xl font-bold text-stone-900 dark:text-stone-100 pt-4 border-t border-stone-300 dark:border-stone-700">
                        <span>Total</span>
                        <span class="text-glamour-primary">R$ {{ totalWithShipping.toFixed(2) }}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
