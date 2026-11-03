/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f11',
        surface: '#17171a',
        line: '#262629',
        fg: '#ededed',
        muted: '#8a8a8f',
        accent: '#6366f1',
      },
      borderRadius: { DEFAULT: '6px' },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
