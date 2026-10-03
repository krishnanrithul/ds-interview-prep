/** @type {import('tailwindcss').Config} */
const c = (name) => `hsl(var(--${name}) / <alpha-value>)`
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: c('background'),
        foreground: c('foreground'),
        card: c('card'),
        border: c('border'),
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
      },
    },
  },
  plugins: [],
}
