/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',      // Extra small devices
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px' },
        'h-sm': { 'raw': '(max-height: 640px)' },
        'h-md': { 'raw': '(max-height: 768px)' },
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333',
            a: {
              color: '#3B82F6',
              '&:hover': {
                color: '#2563EB',
              },
            },
            code: {
              backgroundColor: '#F3F4F6',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
        dark: {
          css: {
            color: '#E5E7EB',
            a: {
              color: '#60A5FA',
              '&:hover': {
                color: '#93C5FD',
              },
            },
            strong: {
              color: '#F3F4F6',
            },
            h1: {
              color: '#F3F4F6',
            },
            h2: {
              color: '#F3F4F6',
            },
            h3: {
              color: '#F3F4F6',
            },
            h4: {
              color: '#F3F4F6',
            },
            code: {
              backgroundColor: '#374151',
              color: '#F3F4F6',
            },
            blockquote: {
              color: '#D1D5DB',
              borderLeftColor: '#4B5563',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    
    // Custom plugin for mobile-specific utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.safe-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}