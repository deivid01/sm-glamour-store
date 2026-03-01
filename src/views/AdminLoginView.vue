<template>
  <div class="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#0F0A1E] transition-colors duration-300 px-4">
    <div class="w-full max-w-md">

      <!-- Logo / Brand -->
      <div class="text-center mb-10">
        <img src="/logos/1.jpeg" alt="SM Glamour" class="h-20 w-auto mx-auto mb-4 rounded-full object-cover shadow-xl">
        <h1 class="text-2xl font-serif text-glamour-primary">Área Restrita</h1>
        <p class="text-stone-500 dark:text-stone-400 text-sm mt-1">Painel Administrativo — SM Glamour</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white dark:bg-[#1a0a2e] rounded-3xl shadow-2xl shadow-glamour-primary/10 border border-glamour-soft/30 dark:border-purple-900/40 p-8">
        <form @submit.prevent="login">
          <div class="mb-5">
            <label class="block text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold mb-2">Usuário</label>
            <input
              v-model="username"
              type="text"
              placeholder="Digite seu usuário"
              autocomplete="username"
              class="w-full border border-glamour-soft dark:border-purple-900/50 bg-stone-50 dark:bg-[#110722] text-stone-900 dark:text-stone-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-glamour-primary transition"
            />
          </div>
          <div class="mb-6">
            <label class="block text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold mb-2">Senha</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                autocomplete="current-password"
                class="w-full border border-glamour-soft dark:border-purple-900/50 bg-stone-50 dark:bg-[#110722] text-stone-900 dark:text-stone-100 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-glamour-primary transition"
              />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-glamour-primary transition">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="error" class="mb-4 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-center">
            ❌ {{ error }}
          </div>

          <button type="submit"
            class="w-full bg-gradient-to-r from-glamour-primary to-pink-400 text-white rounded-full py-4 font-bold uppercase tracking-widest text-sm hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-lg shadow-glamour-primary/30">
            Entrar no Painel
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-stone-400 dark:text-stone-600 mt-6">SM Glamour Store — Área Administrativa</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

const ADMIN_USER = 'stephanie'
const ADMIN_PASS = 'stephanie123456'

const login = () => {
  if (username.value === ADMIN_USER && password.value === ADMIN_PASS) {
    sessionStorage.setItem('smglamour_admin', 'true')
    router.push('/admin')
  } else {
    error.value = 'Usuário ou senha incorretos. Tente novamente.'
    password.value = ''
  }
}
</script>
