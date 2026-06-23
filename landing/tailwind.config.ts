import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00e676',
        'accent-dim': 'rgba(0,230,118,0.6)',
        bg: '#080808',
        surface: '#0e0e0e',
        'surface-2': '#141414',
        border: '#1e1e1e',
        fog: '#f0f0ea',
        'fog-dim': '#a0a09a',
        'fog-muted': '#55554e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'float': 'float 5s ease-in-out infinite',
        'blink': 'blink 1.1s step-end infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(0, 230, 118, 0.25)',
        'glow': '0 0 30px rgba(0, 230, 118, 0.2)',
        'glow-lg': '0 0 60px rgba(0, 230, 118, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
