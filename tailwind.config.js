/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        credo: {
          purple: '#7B6CF6',
          lavender: '#C4B8FF',
          electric: '#6BE4FF',
        },
        landing: {
          bg: '#030308',
          purple: '#a855f7',
          violet: '#7c3aed',
          magenta: '#ec4899',
        },
      },
      fontFamily: {
        display: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
