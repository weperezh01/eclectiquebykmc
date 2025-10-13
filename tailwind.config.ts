import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./app/routes/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a1a1a",
          light: "#2e2e2e",
        },
        accent: "#b48b57",
      },
    },
  },
  plugins: [],
} satisfies Config;

