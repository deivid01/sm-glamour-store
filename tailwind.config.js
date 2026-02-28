/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glamour: {
          primary: '#D17A8C', // Rosa destaque (Logo)
          soft: '#F9D6D9',    // Rosa suave marmorizado
          gold: '#C5A059'     // Dourado detalhes
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'], // Elegância
      }
    },
  },
  plugins: [],
}
