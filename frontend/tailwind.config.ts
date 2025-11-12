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
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          700: '#b45309',
          900: '#78350f',
        },
        felt: {
          600: '#1e3a2e',
          700: '#0f2419',
          900: '#051710',
        },
      },
      boxShadow: {
        'chip': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-gold-strong': '0 0 30px rgba(245, 158, 11, 0.6)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
