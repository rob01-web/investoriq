// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        deepNavy: "#0F172A",
        teal: "#1F8A8A",
        gold: "#D4AF37",
        grayDark: "#374151",
        grayMid: "#6B7280",
        grayLight: "#E5E7EB",
        paper: "#F9FAFB",
        border: "#E5E7EB", // ✅ fixes the "border-border" class
      },
      borderColor: {
        DEFAULT: "#E5E7EB",
      },
    },
  },
  plugins: [],
};
