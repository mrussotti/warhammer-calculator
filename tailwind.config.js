/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces - deep blacks
        void: '#05050a',
        deep: '#0a0a0f',
        base: '#0f0f14',
        elevated: '#15151c',
        surface: '#1a1a24',
        hover: '#22222e',
        
        // Accent - fire/orange
        accent: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          lighter: '#fdba74',
          subtle: 'rgba(249, 115, 22, 0.1)',
          glow: 'rgba(249, 115, 22, 0.5)',
        },
        
        // Text hierarchy
        primary: '#f5f5f7',
        secondary: '#a1a1aa',
        tertiary: '#71717a',
        muted: '#52525b',
        
        // Borders
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          default: 'rgba(255, 255, 255, 0.1)',
          strong: 'rgba(255, 255, 255, 0.15)',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(249, 115, 22, 0.2)',
        'glow-sm': '0 0 20px rgba(249, 115, 22, 0.15)',
        'glow-lg': '0 0 40px rgba(249, 115, 22, 0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(249, 115, 22, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}
