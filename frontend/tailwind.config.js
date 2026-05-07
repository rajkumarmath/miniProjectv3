/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        background: '#050505',
        surface: '#0f172a', // slate-900
        surface2: '#1e293b', // slate-800
        brand: {
          cyan: '#06b6d4',
          purple: '#a855f7',
          magenta: '#db2777',
          blue: '#3b82f6',
          indigo: '#6366f1',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
