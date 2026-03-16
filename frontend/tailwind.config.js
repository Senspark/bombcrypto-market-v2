/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'terminal-black': '#0a0a0a',
        'terminal-green': '#00ff41',
        'terminal-red': '#ff0033',
        'terminal-dark': '#111111',
      },
      fontFamily: {
        'mono': ['Courier New', 'Courier', 'monospace'],
      }
    },
  },
  plugins: [],
}
