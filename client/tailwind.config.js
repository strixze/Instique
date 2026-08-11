/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        forest: {
          DEFAULT: '#35583F',
          dark: '#294632',
          light: '#3F7652',
        },
        // Text
        deep: '#1F2A23',
        secondary: '#66736A',
        muted: '#7B877F',
        // Surfaces
        page: '#F3F7F4',
        card: '#FFFFFF',
        surface: '#EEF3EF',
        sage: {
          DEFAULT: '#DCE8DF',
          soft: '#E8F0EA',
        },
        // Border
        border: '#DCE4DE',
        // Semantic
        success: {
          DEFAULT: '#3F7652',
          light: '#E8F5EC',
          text: '#2D5A3D',
        },
        warning: {
          DEFAULT: '#C49A32',
          light: '#FEF6E0',
          text: '#8B6D1F',
        },
        danger: {
          DEFAULT: '#C85B55',
          light: '#FDE8E7',
          text: '#A13F3A',
        },
        info: {
          DEFAULT: '#6B8F8A',
          light: '#E4F0EE',
          text: '#4A6D68',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        'card': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06)',
        'dropdown': '0 4px 16px rgba(0,0,0,0.08)',
        'modal': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
