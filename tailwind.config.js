/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  blocklist: ['[-:：@]'],
  theme: {
    extend: {
      colors: {
        moss: {
          50: '#f3f8f1',
          100: '#deebd7',
          600: '#4f7d42',
          700: '#3f6535',
          800: '#314f2b'
        },
        leaf: '#7ca56f',
        paper: '#fffdf7'
      },
      boxShadow: {
        soft: '0 12px 40px rgba(49, 79, 43, 0.12)'
      }
    }
  },
  plugins: []
};
