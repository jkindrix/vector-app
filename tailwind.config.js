/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333',
            a: {
              color: '#3B82F6',
              '&:hover': { color: '#2563EB' },
            },
            code: {
              backgroundColor: '#F3F4F6',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
        dark: {
          css: {
            color: '#E5E7EB',
            a: { color: '#60A5FA', '&:hover': { color: '#93C5FD' } },
            strong: { color: '#F3F4F6' },
            h1: { color: '#F3F4F6' },
            h2: { color: '#F3F4F6' },
            h3: { color: '#F3F4F6' },
            h4: { color: '#F3F4F6' },
            code: { backgroundColor: '#374151', color: '#F3F4F6' },
            blockquote: { color: '#D1D5DB', borderLeftColor: '#4B5563' },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
