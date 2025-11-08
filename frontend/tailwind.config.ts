import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Poker Theme
        felt: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          500: '#1a4d2e',
          700: '#0f3322',
          900: '#0a2617',
        },
        gold: {
          50: '#fff9e6',
          100: '#fff3cc',
          500: '#ffd700',
          700: '#daa520',
          900: '#8b6914',
        },
        // Classic Theme
        slate: {
          950: '#0f0f0f',
        },
      },
      boxShadow: {
        'glow-gold': '0 0 40px rgba(255, 215, 0, 0.3)',
        'glow-gold-strong': '0 0 60px rgba(255, 215, 0, 0.5)',
        'felt-inset': 'inset 0 0 60px rgba(0, 0, 0, 0.5)',
        'chip': '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'chip-toss': 'chip-toss 0.8s ease-out',
        'chip-stack': 'chip-stack 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.8)' },
        },
        'chip-toss': {
          '0%': {
            transform: 'scale(0) rotate(0deg)',
            opacity: '0'
          },
          '60%': {
            transform: 'scale(1.2) rotate(360deg)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(1) rotate(720deg)',
            opacity: '1'
          },
        },
        'chip-stack': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
