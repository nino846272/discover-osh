/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      colors: {
        sand: {
          50: '#fdf8f0',
          100: '#f5e6c8',
          200: '#e8c87a',
          300: '#d4a032',
        },
        osh: {
          deep: '#1a1209',
          warm: '#2d1f0a',
          accent: '#c8860a',
          gold: '#e8a820',
          light: '#fdf4e3',
        }
      }
    },
  },
  plugins: [],
}
