import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./app/routes/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2c2c2c",
          light: "#1a1a1a",
          dark: "#0f0f0f",
        },
        secondary: {
          DEFAULT: "#d4af37",
          dark: "#c9a961",
        },
        accent: {
          DEFAULT: "#b48b57",
          dark: "#9a7948",
        },
        neutral: {
          DEFAULT: "#f5f5f5",
          dark: "#252525",
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-md': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        'hero': '0 8px 32px rgba(0,0,0,0.1)',
        'cta': '0 8px 25px rgba(212, 175, 55, 0.3)',
      },
      animation: {
        'slideDown': 'slideDown 0.4s ease-out forwards',
        'slideUp': 'slideUp 0.3s ease-in forwards',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'fadeOut': 'fadeOut 0.2s ease-in forwards',
      },
      keyframes: {
        slideDown: {
          '0%': { 
            opacity: '0',
            height: '0',
            transform: 'translateY(-10px) scaleY(0.8)',
            transformOrigin: 'top',
          },
          '50%': {
            opacity: '0.7',
            height: 'auto',
            transform: 'translateY(-5px) scaleY(0.9)',
          },
          '100%': { 
            opacity: '1',
            height: 'auto',
            transform: 'translateY(0) scaleY(1)',
          },
        },
        slideUp: {
          '0%': { 
            opacity: '1',
            height: 'auto',
            transform: 'translateY(0) scaleY(1)',
            transformOrigin: 'top',
          },
          '50%': {
            opacity: '0.3',
            transform: 'translateY(-5px) scaleY(0.9)',
          },
          '100%': { 
            opacity: '0',
            height: '0',
            transform: 'translateY(-10px) scaleY(0.8)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

