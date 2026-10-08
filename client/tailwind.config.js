/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--void)',
        graphite: 'var(--graphite)',
        slate: 'var(--slate)',
        mist: 'var(--mist)',
        paper: 'var(--paper)',
        trace: 'var(--trace)',
      },
      fontFamily: {
        sans: ['Geist', 'Geist Sans', 'sans-serif'],
      },
      fontSize: {
        // Display: clamp(48px, 8vw, 96px), weight 600, letter-spacing -0.03em, line-height 1.02
        'display': ['clamp(3rem, 8vw, 6rem)', {
          lineHeight: '1.02',
          letterSpacing: '-0.03em',
          fontWeight: '600',
        }],
        // H2: clamp(36px, 5vw, 64px), weight 600, letter-spacing -0.02em, line-height 1.05
        'heading-2': ['clamp(2.25rem, 5vw, 4rem)', {
          lineHeight: '1.05',
          letterSpacing: '-0.02em',
          fontWeight: '600',
        }],
        // H3: 24-28px, weight 600
        'heading-3': ['clamp(1.5rem, 3vw, 1.75rem)', {
          fontWeight: '600',
          lineHeight: '1.3',
        }],
        // Body large: 21px / 1.45
        'body-large': ['21px', {
          lineHeight: '1.45',
        }],
        // Body: 17px / 1.5
        'body': ['17px', {
          lineHeight: '1.5',
        }],
        // Small: 14px
        'small': ['14px', {
          lineHeight: '1.4',
        }],
      },
      spacing: {
        'section-desk': '160px',
        'section-mob': '96px',
        'side-desk': '48px',
        'side-mob': '24px',
      },
      maxWidth: {
        'site': '1200px',
        'text': '720px',
      },
      borderRadius: {
        'media': '18px',
        'pill': '999px',
      }
    },
  },
  plugins: [],
}