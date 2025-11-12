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

export const PALETTE = {
  deepNavy: "#0F172A", // core background / headers
  teal: "#1F8A8A", // primary accent
  aqua: "#94D9D9", // secondary accent
  gold: "#D4AF37", // highlight / key lines
  grayDark: "#374151",
  grayMid: "#6B7280",
  grayLight: "#E5E7EB",
  paper: "#F9FAFB",
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
  header(text, color = PALETTE.deepNavy) {
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
