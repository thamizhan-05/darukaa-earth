/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0D1117',
          surface: '#161B22',
          elevated: '#1C2333',
          overlay: '#21262D',
        },
        border: {
          DEFAULT: '#30363D',
          muted: '#21262D',
          subtle: '#1C2333',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          muted: '#6E7681',
          inverse: '#0D1117',
        },
        accent: {
          green: '#3FB950',
          emerald: '#238636',
          teal: '#39D353',
          light: '#56D364',
        },
        warning: {
          DEFAULT: '#D29922',
          light: '#E3B341',
        },
        danger: {
          DEFAULT: '#F85149',
          light: '#FF7B72',
        },
        info: {
          DEFAULT: '#388BFD',
          light: '#79C0FF',
        },
        carbon: {
          DEFAULT: '#2EA043',
          light: '#56D364',
          dark: '#1A7F37',
        },
        bio: {
          DEFAULT: '#1A7F8A',
          light: '#39C5CF',
        },
        ndvi: {
          DEFAULT: '#5A8A1A',
          light: '#8EC63F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        elevated: '0 4px 12px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(63,185,80,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(63,185,80,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(63,185,80,0)' },
        },
      },
    },
  },
  plugins: [],
}
