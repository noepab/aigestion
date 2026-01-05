/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // enable class‑based dark mode for premium theming
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#121212',
        'cyber-black': '#0a0a0a',
        'cyber-gray': '#1e1e1e',
        'cyber-blue': '#00f3ff',
        'cyber-purple': '#bc13fe',
        'cyber-green': '#0aff00',
        'cyber-red': '#ff003c',
      },
      boxShadow: {
        'neon-blue': '0 0 10px #00f3ff, 0 0 20px #00f3ff',
        'neon-purple': '0 0 10px #bc13fe, 0 0 20px #bc13fe',
        glow: '0 0 20px rgba(139, 92, 246, 0.5)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, .3)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, #1e1e1e 1px, transparent 1px), linear-gradient(to bottom, #1e1e1e 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scan: 'scan 4s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
          '100%': {
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(236, 72, 153, 0.6)',
          },
        },
      },
    },
  },
  plugins: [],
};
