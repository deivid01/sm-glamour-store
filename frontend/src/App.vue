<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans selection:bg-glamour-soft selection:text-glamour-primary relative overflow-hidden bg-[#FAF9F6] z-0">
    <!-- Background Animation (Blobs) -->
    <div class="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-glamour-soft/50 rounded-full blur-[120px] mix-blend-multiply animate-blob"></div>
      <div class="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-glamour-primary/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
      <div class="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-glamour-gold/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
    </div>

    <Navbar />
    
    <main class="flex-grow z-10">
      <RouterView :key="$route.fullPath" />
    </main>

    <Footer class="z-10" />
  </div>
</template>
