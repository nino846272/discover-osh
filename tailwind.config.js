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
          deep: '#120e0a',
          warm: '#1c1510',
          accent: '#caa263',
          gold: '#d49b41',
          light: '#f5e6c8',
        }
      }
    },
  },
  plugins: [],
}
