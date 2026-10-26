import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      fontFamily: {
        arabic: ['"Noto Kufi Arabic"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        luxury: {
          gold: '#D4AF37',
          'gold-dark': '#B8960F',
          chocolate: '#8B6914',
          cream: '#FDF8ED',
          champagne: '#F5E6C8',
          slate: '#64748B',
          surface: '#FFFFFF',
          bg: '#FAF6EE',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        gold: '0 8px 32px rgba(212, 175, 55, 0.08)',
        'gold-lg': '0 12px 48px rgba(212, 175, 55, 0.12)',
        card: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        glass: '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'counter': 'counter 1.5s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        counter: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
