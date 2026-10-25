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
        gdgoc: {
          blue: '#2563EB',
          red: '#EA4335',
          yellow: '#FBBC04',
          green: '#34A853',
          gray: {
            50: 'rgb(var(--gray-50) / <alpha-value>)',
            100: 'rgb(var(--gray-100) / <alpha-value>)',
            200: 'rgb(var(--gray-200) / <alpha-value>)',
            300: 'rgb(var(--gray-300) / <alpha-value>)',
            400: 'rgb(var(--gray-400) / <alpha-value>)',
            500: 'rgb(var(--gray-500) / <alpha-value>)',
            600: 'rgb(var(--gray-600) / <alpha-value>)',
            700: 'rgb(var(--gray-700) / <alpha-value>)',
            800: 'rgb(var(--gray-800) / <alpha-value>)',
            900: 'rgb(var(--gray-900) / <alpha-value>)',
          }
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
