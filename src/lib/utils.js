// ------------------------------------------------------------
// src/lib/utils.js
// Global InvestorIQ Utility Library
// ------------------------------------------------------------
// Unified helper layer for formatting, validation, async control,
// PDF generation support, and brand-wide constants.
// Safe for both browser + Node environments (Vite, Supabase, etc.)
// ------------------------------------------------------------

import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

// ------------------------------------------------------------
// BRAND + THEME
// ------------------------------------------------------------
export const BRAND = {
  name: "InvestorIQ",
  domain: "investoriq.tech",
  email: "hello@investoriq.tech",
};

// ─── INVESTORIQ DESIGN SYSTEM — Hybrid Palette ───────────────
// Forest Green on cover/hero only. Ink + Gold on interiors.
// Rule: green = brand moments. gold = signal. ink = authority.
export const PALETTE = {
  // Primary brand — Forest Green
  green:       "#0F2318",   // cover, hero bands, nav, CTAs
  greenMid:    "#163320",   // hover states on green backgrounds

  // Accent — Gold
  gold:        "#C9A84C",   // primary accent, CTA text on green
  goldDark:    "#9A7A2C",   // labels, eyebrows, secondary gold

  // Interior ink scale
  ink:         "#0C0C0C",   // primary body text
  ink2:        "#363636",   // secondary body text
  ink3:        "#606060",   // tertiary / muted text
  ink4:        "#9A9A9A",   // ghost / placeholder text

  // Surface scale
  white:       "#FFFFFF",   // page canvas
  warm:        "#FAFAF8",   // card backgrounds, section tints
  hairline:    "#E8E5DF",   // borders, dividers
  hairlineMid: "#D0CCC4",   // stronger borders, underlines

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

  // ── Legacy aliases — kept for backward compat while migrating ──
  // Any old component referencing PALETTE.teal gets gold.
  // Any old component referencing PALETTE.deepNavy gets green.
  deepNavy:    "#0F2318",   // → maps to green
  teal:        "#C9A84C",   // → maps to gold
  aqua:        "#C9A84C",   // → maps to gold
  paper:       "#FAFAF8",   // → maps to warm
  grayDark:    "#363636",   // → maps to ink2
  grayMid:     "#606060",   // → maps to ink3
  grayLight:   "#E8E5DF",   // → maps to hairline
};

// ------------------------------------------------------------
// CLASSNAME MERGE (for Tailwind conditional classes)
// ------------------------------------------------------------
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ------------------------------------------------------------
// FORMATTERS
// ------------------------------------------------------------
export const fmt = {
  currency(value, currency = "USD", decimals = 0) {
    if (value == null || isNaN(value)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  number(value, decimals = 0) {
    if (value == null || isNaN(value)) return "";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  percent(value, decimals = 1) {
    if (value == null || isNaN(value)) return "";
    return `${Number(value).toFixed(decimals)}%`;
  },
};

// ------------------------------------------------------------
// TEXT UTILITIES
// ------------------------------------------------------------
export const sanitize = (text = "") =>
  String(text)
    .replace(/[–—]/g, "-") // replace em/en dashes
    .replace(/\s+/g, " ")
    .trim();

export const titleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ------------------------------------------------------------
// ASYNC + FLOW CONTROL
// ------------------------------------------------------------
export const sleep = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const to = async (promise) => {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, undefined];
  }
};

export const invariant = (condition, message) => {
  if (!condition) throw new Error(message || "Invariant failed");
};

// ------------------------------------------------------------
// IDENTIFIERS + RANDOMIZATION
// ------------------------------------------------------------
export const uid = (prefix = "iq") =>
  `${prefix}_${Math.random().toString(36).substring(2, 10)}`;

// ------------------------------------------------------------
// DATE HELPERS (pinned to America/Toronto)
// ------------------------------------------------------------
export const dates = {
  now: () =>
    new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" }),
  short: (d) =>
    new Date(d).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
};

// ------------------------------------------------------------
// FINANCIAL METRICS (Institutional Standards)
// ------------------------------------------------------------
export const realestate = {
  capRate: (noi, value) => (value > 0 ? (noi / value) * 100 : 0),
  dscr: (noi, debtService) => (debtService > 0 ? noi / debtService : 0),
  ltv: (loan, value) => (value > 0 ? (loan / value) * 100 : 0),
};

// ------------------------------------------------------------
// SHORTCUT CONSTANTS
// ------------------------------------------------------------
export const FX = fmt.currency;
export const PCT = fmt.percent;

// ------------------------------------------------------------
// PDFMAKE HELPERS (used by generatePDF and pdfSections.js)
// ------------------------------------------------------------
export const pdf = {
  header(text, color = PALETTE.green) {
    return {
      text: sanitize(text),
      style: "header",
      color,
      margin: [0, 10, 0, 4],
    };
  },

  kv(label, value) {
    return {
      columns: [
        { text: sanitize(label), width: "35%", bold: true },
        { text: sanitize(value ?? ""), width: "65%" },
      ],
      margin: [0, 2],
    };
  },

  line(color = PALETTE.gold) {
    return {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: color },
      ],
      margin: [0, 6],
    };
  },

  spacer(height = 8) {
    return { text: "", margin: [0, height] };
  },
};
