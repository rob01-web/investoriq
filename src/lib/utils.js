// src/lib/utils.js
// Global utilities for InvestorIQ ELITE
// Includes class merging, formatting, and brand palette constants

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Safely merges conditional Tailwind classes
 * Usage: <div className={cn("p-4", condition && "bg-gold")}>
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Global color palette — matches PDF and web branding
 */
export const PALETTE = {
  deepNavy: "#0F172A",   // core background / headers
  teal: "#1F8A8A",       // primary accent
  aqua: "#94D9D9",       // secondary accent
  gold: "#D4AF37",       // highlight & key lines
  grayDark: "#374151",
  grayMid: "#6B7280",
  grayLight: "#E5E7EB",
  paper: "#F9FAFB",
};

/**
 * Number / currency / percent formatters (reused by UI & PDF)
 */
export const formatCurrency = (value, currency = "USD", decimals = 0) => {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatNumber = (value, decimals = 0) => {
  if (value == null || isNaN(value)) return "—";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return "—";
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Capitalizes the first letter of each word (titles, labels, etc.)
 */
export const titleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * Returns true if a string looks like a valid email
 */
export const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Simple sleep / delay helper for async flows
 * Example: await sleep(500)
 */
export const sleep = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));
