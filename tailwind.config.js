/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B0F14",
          panel: "#161B22",
          border: "#21262D",
          cyan: "#00F0FF",
          pink: "#FF3366",
          textMain: "#F0F6FC",
          textMuted: "#8B949E",
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 240, 255, 0.4)',
        'cyan-intense': '0 0 25px rgba(0, 240, 255, 0.6)',
      }
    },
  },
  plugins: [],
}
