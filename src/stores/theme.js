import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // Default to the user's OS preference, then fallback to dark
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('smglamour-theme')

    const isDark = ref(savedTheme ? savedTheme === 'dark' : prefersDark)

    const applyTheme = (dark) => {
        if (dark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    // Apply immediately on store init
    applyTheme(isDark.value)

    // Watch for changes and persist
    watch(isDark, (dark) => {
        applyTheme(dark)
        localStorage.setItem('smglamour-theme', dark ? 'dark' : 'light')
    })

    const toggle = () => {
        isDark.value = !isDark.value
    }

    return { isDark, toggle }
})
