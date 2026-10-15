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
          // === VAULTCHAIN 3.0 Futuristic Palette ===
          midnight:  "#050720",   // deepest canvas
          bg:        "#050720",   // primary background
          secondary: "#10164A",   // deep indigo
          panel:     "#0C1342",   // panel surface
          card:      "#111B57",   // glassmorphic card base
          elevated:  "#172368",   // hover / elevated card
          border:    "rgba(139, 146, 255, 0.22)", // luminous border
          
          blue:      "#4169FF",   // electric blue
          violet:    "#7C3AED",   // vivid violet
          purple:    "#A855F7",   // neon purple
          magenta:   "#EC4899",   // magenta accent
          pink:      "#EC4899",   // alias for magenta
          
          text:      "#F8FAFC",   // primary text
          muted:     "#B8C5F2",   // secondary text
          faint:     "#7E8DC4",   // tertiary text
          
          // Semantic statuses strictly preserved
          success:   "#10B981",   // green only for success/verified
          warning:   "#F59E0B",   // amber for warning
          danger:    "#EF4444",   // red for danger/error
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'purple-glow':    '0 0 25px rgba(168, 85, 247, 0.45)',
        'blue-glow':      '0 0 25px rgba(65, 105, 255, 0.45)',
        'violet-glow':    '0 0 30px rgba(124, 58, 237, 0.5)',
        'magenta-glow':   '0 0 25px rgba(236, 72, 153, 0.45)',
        'glass':          '0 8px 32px 0 rgba(5, 7, 32, 0.6)',
        'neon-border':    '0 0 15px rgba(124, 58, 237, 0.35)',
      },
      backgroundImage: {
        'theme-gradient':   'linear-gradient(135deg, #4169FF 0%, #7C3AED 50%, #A855F7 100%)',
        'purple-gradient':  'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
        'blue-gradient':    'linear-gradient(135deg, #4169FF 0%, #7C3AED 100%)',
        'magenta-gradient': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(16, 22, 74, 0.75) 0%, rgba(17, 27, 87, 0.75) 100%)',
        'dark-gradient':    'linear-gradient(180deg, #050720 0%, #10164A 50%, #050720 100%)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer-beam': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 4s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'shimmer-beam': 'shimmer-beam 2.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}