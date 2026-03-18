import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#ffffff',
        blue: {
          accent: '#0066ff',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate',
        'subtle-glow': 'subtleGlow 3s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(0, 102, 255, 0.7)' },
        },
        subtleGlow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 102, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.3)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 102, 255, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 102, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
