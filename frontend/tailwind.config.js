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
        glass: 'rgba(255, 255, 255, 0.08)',
        'glass-border': 'rgba(255, 255, 255, 0.12)',
        'glass-hover': 'rgba(255, 255, 255, 0.14)',
        'dark-bg': '#0a0a0f',
        'dark-card': '#13131a',
        'dark-border': '#1e1e2a',
        'dark-hover': '#1a1a26',
        'accent': '#6366f1',
        'accent-light': '#818cf8',
        'accent-dark': '#4f46e5',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'info': '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
