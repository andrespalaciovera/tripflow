/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Public Sans', 'sans-serif'],
      },
      fontSize: {
        h1: ['48px', { lineHeight: '50px', letterSpacing: '-1.92px', fontWeight: '800' }],
        h2: ['32px', { lineHeight: '36px', fontWeight: '700' }],
        h3: ['24px', { lineHeight: '28px', fontWeight: '700' }],
        body: ['16px', { lineHeight: '20px', fontWeight: '400' }],
        label: ['12px', { lineHeight: '20px', fontWeight: '600' }],
      },
      colors: {
        'bg-body': '#F6F4ED',
        'bg-navbar-forms': '#FBF9F2',
        'bg-surface': '#FFFFFF',
        'bg-list-item': '#EEE9DC',
        'ink-primary': '#000000',
        'ink-muted': '#45464D',
        'stroke-form': '#EBE7DC',
        'btn-disable': '#C7C7C7',

        'status-activo-bg': '#E2F7CE',
        'status-activo-text': '#386A00',
        'status-proximo-bg': '#FDF5C7',
        'status-proximo-text': '#6C5E00',
        'status-finalizado-bg': '#E8E6DE',
        'status-finalizado-text': '#A19E95',

        'alert-min': '#A8E56F',
        'alert-medium': '#ECCD7F',
        'alert-max': '#E29683',

        'pills': 'rgba(255, 255, 255, 0.25)',
        'sub-cards': 'rgba(255, 255, 255, 0.45)'
      },
      borderRadius: {
        'xs': '8px',
        'sm': '16px',
        'md': '20px',
        'lg': '28px',
        'full': '9999px',
      },
      boxShadow: {
        soft: '0 10px 30px 0px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
}
