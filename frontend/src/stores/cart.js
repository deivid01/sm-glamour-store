import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
    const items = ref([])

    const cartTotal = computed(() => {
        return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
    })

    const cartCount = computed(() => {
        return items.value.reduce((count, item) => count + item.quantity, 0)
    })

    function addToCart(product, quantity = 1) {
        const existingItem = items.value.find(item => item.id === product.id)
        if (existingItem) {
            existingItem.quantity += quantity
        } else {
            items.value.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                category: product.category
            })
        }
    }

    function removeFromCart(productId) {
        items.value = items.value.filter(item => item.id !== productId)
    }

    function updateQuantity(productId, quantity) {
        const item = items.value.find(item => item.id === productId)
        if (item && quantity > 0) {
            item.quantity = quantity
        }
    }

    function clearCart() {
        items.value = []
    }

    return {
        items,
        cartTotal,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
    }
})
