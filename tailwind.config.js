/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── InvestorIQ Hybrid Design System ──────────────────────────────────
        // Forest Green + Ink + Whisper Gold
        // Primary brand
        green:       "#0F2318",
        greenMid:    "#163320",

        // Gold accent
        gold:        "#C9A84C",
        goldDark:    "#9A7A2C",

        // Ink scale
        ink:         "#0C0C0C",
        ink2:        "#363636",
        ink3:        "#606060",
        ink4:        "#9A9A9A",

        // Surface
        warm:        "#FAFAF8",
        hairline:    "#E8E5DF",
        hairlineMid: "#D0CCC4",

        // Semantic
        okGreen:     "#1A4A22",
        okBg:        "#F2F8F3",
        okBorder:    "#B8D4BC",
        errRed:      "#7A1A1A",
        errBg:       "#FDF4F4",
        errBorder:   "#E8C0C0",
        warnAmber:   "#7A4A00",
        warnBg:      "#FDF8EE",
        warnBorder:  "#E8D4A0",

        // ── Legacy aliases — kept so old class names still resolve ────────────
        // Components still using iqnavy/iqteal/iqgold will now render correctly.
        iqnavy:    "#0F2318",   // → Forest Green
        iqteal:    "#C9A84C",   // → Gold
        iqgold:    "#C9A84C",   // → Gold
        deepNavy:  "#0F2318",   // → Forest Green
        teal:      "#C9A84C",   // → Gold
        paper:     "#FAFAF8",   // → Warm
        grayDark:  "#363636",   // → Ink2
        grayMid:   "#606060",   // → Ink3
        grayLight: "#E8E5DF",   // → Hairline
        border:    "#E8E5DF",   // → Hairline
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body:    ["'DM Sans'", "system-ui", "sans-serif"],
        mono:    ["'DM Mono'", "'Courier New'", "monospace"],
      },
      keyframes: {
        progress: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        progress: 'progress 1.8s ease-in-out infinite',
        spin:     'spin 1s linear infinite',
      },
      borderRadius: {
        // Institutional — no rounding on structural elements
        DEFAULT: '0',
        none:    '0',
        sm:      '0',
        md:      '0',
        lg:      '0',
        xl:      '0',
        '2xl':   '0',
        '3xl':   '0',
        full:    '9999px', // keep for pills/badges only
      },
    },
  },
  plugins: [],
};
