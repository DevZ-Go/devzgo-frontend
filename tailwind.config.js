/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./ui/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        // Warm pastel palette
        cream: {
          50: '#FFFDF7',
          100: '#FFF9ED',
          200: '#FFF3DB',
          300: '#FFECC4',
        },
        coral: {
          50: '#FFF5F3',
          100: '#FFE8E3',
          200: '#FFD4CC',
          300: '#FFB4A6',
          400: '#FF8F7D',
          500: '#F97066',
          600: '#E04D42',
        },
        lavender: {
          50: '#F8F5FF',
          100: '#F0EAFF',
          200: '#E2D7FF',
          300: '#CBBDFF',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        mint: {
          50: '#F0FDF9',
          100: '#DFFBF0',
          200: '#B6F5DC',
          300: '#7EEBC2',
          400: '#34D399',
          500: '#10B981',
        },
        peach: {
          50: '#FFF7F0',
          100: '#FFEDD5',
          200: '#FFDDB5',
          300: '#FFC78A',
          400: '#FBAC5E',
          500: '#F59E0B',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.04), 0 1px 6px -1px rgba(0,0,0,0.02)',
        'soft-lg': '0 4px 25px -5px rgba(0,0,0,0.06), 0 2px 10px -2px rgba(0,0,0,0.03)',
        'soft-xl': '0 8px 40px -8px rgba(0,0,0,0.08), 0 4px 15px -3px rgba(0,0,0,0.04)',
        'glow-coral': '0 4px 20px -4px rgba(249, 112, 102, 0.3)',
        'glow-lavender': '0 4px 20px -4px rgba(139, 92, 246, 0.3)',
        'glow-mint': '0 4px 20px -4px rgba(52, 211, 153, 0.3)',
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(10px)' },
          '60%': { opacity: '1', transform: 'scale(1.05) translateY(-2px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(3deg)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
