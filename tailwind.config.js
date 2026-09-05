/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          50:  '#f0f0ff',
          100: '#e3e3ff',
          200: '#c7c7ff',
          300: '#a9a9ff',
          400: '#8585ff',
          500: '#6060ff',
          600: '#4040e8',
          700: '#2d2dcc',
          800: '#1a1ab3',
          900: '#0d0d99',
          950: '#050566',
        },
        brand: {
          primary:   '#7C3AED',  // violet-700
          secondary: '#4F46E5',  // indigo-600
          accent:    '#06B6D4',  // cyan-500
          success:   '#10B981',  // emerald-500
          warning:   '#F59E0B',  // amber-500
          error:     '#EF4444',  // red-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-midnight': 'linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 50%, #0d1a2e 100%)',
        'gradient-brand':    'linear-gradient(135deg, #7C3AED, #4F46E5)',
        'gradient-success':  'linear-gradient(135deg, #059669, #10B981)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':      'fadeIn 0.5s ease-out',
        'slide-up':     'slideUp 0.5s ease-out',
        'glow':         'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                   to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        glow:    { from: { boxShadow: '0 0 5px rgba(124,58,237,0.3)' },   to: { boxShadow: '0 0 20px rgba(124,58,237,0.8)' } },
      },
    },
  },
  plugins: [],
};
