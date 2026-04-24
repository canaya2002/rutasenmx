/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Matches web tokens so screenshots feel like the same product.
        background: '#0A0F14',
        foreground: '#F8FAFC',
        terracotta: '#C4532B',
        oaxaca: '#D97706',
        emerald: {
          DEFAULT: '#06C167',
          dark: '#05a558',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
};
