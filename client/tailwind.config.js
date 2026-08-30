/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Violet / Periwinkle Identity (#6C5CE7)
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C6CF2',
          600: '#6C5CE7',
          700: '#5B4BC4',
          800: '#4C3DA8',
          900: '#3D318A',
          DEFAULT: '#6C5CE7',
          hover: '#5B4BC4',
          dark: '#4C3DA8',
          light: '#A78BFA',
          soft: '#F5F3FF',
          muted: '#EDE9FE',
        },
        // Forest alias (harmonized with the new violet palette for complete backward-compatibility)
        forest: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C6CF2',
          600: '#6C5CE7',
          700: '#5B4BC4',
          800: '#4C3DA8',
          900: '#3D318A',
          DEFAULT: '#6C5CE7',
          hover: '#5B4BC4',
          dark: '#4C3DA8',
          light: '#A78BFA',
          soft: '#F5F3FF',
          muted: '#EDE9FE',
        },
        // Professional Typography Hierarchy (Slate-based neutrals)
        deep: '#0F172A',
        body: '#334155',
        secondary: '#475569',
        muted: '#64748B',
        subtle: '#94A3B8',
        // Background Surfaces
        page: '#F8FAFC',
        card: '#FFFFFF',
        surface: '#F1F5F9',
        sage: {
          DEFAULT: '#F5F3FF',
          soft: '#FAF8FF',
          border: '#EDE9FE',
          text: '#6C5CE7',
        },
        // Clean System Borders
        border: '#E2E8F0',
        'border-subtle': '#EEF2F6',
        'border-light': '#F1F5F9',
        // Semantic Operational Colors (Preserved)
        success: {
          DEFAULT: '#16A34A',
          light: '#E8F5EC',
          text: '#15803D',
          dark: '#166534',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          text: '#B45309',
          dark: '#92400E',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          text: '#B91C1C',
          dark: '#991B1B',
        },
        info: {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
          text: '#1D4ED8',
          dark: '#1E40AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        'card': '12px',
        'card-lg': '16px',
        'pill': '9999px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'xs': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 4px 12px 0 rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
        'dropdown': '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
}
