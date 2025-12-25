/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.transform-gpu': {
          transform: 'translate3d(0, 0, 0)',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
          '-moz-backface-visibility': 'hidden',
        },
        '.perspective-1000': {
          perspective: '1000px',
          '-webkit-perspective': '1000px',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}