<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import { useThemeStore } from './stores/theme'

// Initialize theme store on mount (applies class to <html>)
useThemeStore()
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans selection:bg-glamour-soft selection:text-glamour-primary relative overflow-hidden z-0
              bg-[#FAF9F6] dark:bg-[#0F0A1E] transition-colors duration-300">
    <!-- Background Animation (Blobs) — adapts to theme -->
    <div class="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-glamour-soft/50 dark:bg-glamour-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
      <div class="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-glamour-primary/20 dark:bg-purple-900/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
      <div class="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-glamour-gold/20 dark:bg-glamour-gold/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>
    </div>

    <Navbar />
    
    <main class="flex-grow z-10">
      <RouterView :key="$route.fullPath" />
    </main>

    <Footer class="z-10" />
  </div>
</template>
