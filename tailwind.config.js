/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f6',
          500: '#0e87e9',
          600: '#026bc7',
          700: '#0355a1',
          800: '#074884',
          900: '#0c3d6e',
          950: '#082749',
        },
        church: {
          gold: '#D4AF37',
          'gold-light': '#F4E07B',
          'gold-dark': '#A08020',
          navy: '#0F172A',
          burgundy: '#800020',
          wood: '#4A2E18',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Cairo', 'Segoe UI', 'sans-serif'],
        arabic: ['Cairo', 'Tajawal', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
