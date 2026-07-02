/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          darker: '#1e3a8a',
          light: '#dbeafe',
          muted: '#eff6ff',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
}
