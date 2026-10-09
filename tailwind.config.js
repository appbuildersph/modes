/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'var(--gb-background)',
        mint: 'var(--gb-secondary)',
        sky: 'var(--gb-sky)',
        rose: 'var(--gb-rose)',
        peach: 'var(--gb-peach)',
        yellow: 'var(--gb-primary)',
        lavender: 'var(--gb-lavender)',
        ink: 'var(--gb-ink)',
        outline: 'var(--gb-outline)',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'Fredoka', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
      },
      boxShadow: {
        hard: '4px 4px 0 0 var(--gb-outline)',
        'hard-sm': '2px 2px 0 0 var(--gb-outline)',
        'hard-lg': '6px 6px 0 0 var(--gb-outline)',
      },
      borderWidth: {
        2.5: '2.5px',
      },
    },
  },
  plugins: [],
}
