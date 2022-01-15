// tailwind.config.js
const colors = require('tailwindcss/colors')
module.exports = {
  content: [
    './public/**/*.html',
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container:{
      padding: '3rem'
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      transparent: 'transparent',
      black: colors.black,
      white: colors.white,
      gray: colors.trueGray,
      red: {
        DEFAULT: '#ED2F57'
      },
      green: {
        DEFAULT: '#06A77D',
        darklime: '#84EE30',
        lime: '#B0FB8C'
      },
      yellow: {
        DEFAULT: '#FFC919'
      },
      darkgray: {
        DEFAULT: '#273140',
        grayinput: '#EEEEEE'
      },
      purple: {
        DEFAULT: '#3d53a4'
      },
      brown: {
        dirt: '#996E5E',
        clay: '#BE6A5E',
        sand: '#DBBD80'
      }
    }
  },
  fontFamily: {
    sans: ['Poppins', 'sans-serif'],
  },
  plugins: [],
};