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
          DEFAULT: "#f8f6f0",
          dark: "#2a2a2a",
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
    },
  },
  plugins: [],
} satisfies Config;

