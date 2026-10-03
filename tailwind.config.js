/** @type {import('tailwindcss').Config} */
const c = (name) => `hsl(var(--${name}) / <alpha-value>)`
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Literata', 'Georgia', 'ui-serif', 'serif'],
      },
      colors: {
        background: c('background'),
        foreground: c('foreground'),
        card: c('card'),
        border: c('border'),
        ink: { DEFAULT: c('ink'), foreground: c('ink-foreground') },
        marker: c('marker'),
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
      },
    },
  },
  plugins: [],
}
