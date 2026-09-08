import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        surf: 'rgb(var(--color-surf) / <alpha-value>)',
        accent: '#1E847F',
        coral: '#DA5A5A',
        amber: '#D49A1A'
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['Manrope', 'sans-serif']
      },
      boxShadow: {
        panel: '0 16px 36px rgba(18, 38, 58, 0.12)'
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        rise: 'rise 500ms ease-out both'
      }
    }
  },
  plugins: []
};

export default config;
