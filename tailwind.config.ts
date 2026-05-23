import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#fdfbf6",
          100: "#faf6ec",
          200: "#f3ecd9",
          300: "#e8dcbe",
          400: "#d9c89c",
          500: "#c2a875",
          600: "#a68856",
          700: "#856a3f",
          800: "#5c4828",
          900: "#3d2f1a",
        },
        ink: {
          50: "#f5f2ed",
          100: "#e0dbd0",
          200: "#9a9183",
          400: "#5c5448",
          600: "#3a342b",
          800: "#1f1c17",
          900: "#0f0e0b",
        },
        accent: {
          rose: "#b3437a",
          amber: "#c2410c",
          moss: "#4a7c3e",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
