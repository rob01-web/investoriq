import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * InvestorIQHeader Component
 * --------------------------
 * Reusable responsive header with smooth scroll, animated logo,
 * sticky background, and navigation links.
 */
export default function InvestorIQHeader() {
  const logoUrl = "/assets/logo.png";

  // Scroll-based effects
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 200], [1, 0.85]);
  const headerBg = useTransform(scrollY, [0, 200], ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.98)"]);
  const shadowOpacity = useTransform(scrollY, [0, 200], [0, 0.25]);

  return (
    <motion.header
      style={{
        backgroundColor: headerBg,
        boxShadow: shadowOpacity ? `0 4px 16px rgba(0,0,0,${shadowOpacity.get()})` : "none",
      }}
      className="w-full backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 sm:px-10">
        {/* LOGO — Smooth Scroll to Top */}
        <motion.div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ scale, cursor: "pointer" }}
          className="flex items-center select-none"
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <img
            src={logoUrl}
            alt="InvestorIQ Logo"
            className="h-16 sm:h-20 md:h-24 w-auto object-contain transition-transform hover:scale-105"
          />
        </motion.div>

        {/* NAVIGATION */}
        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-700">
          <a href="/sample-report" className="hover:text-[#1F8A8A] transition">
            Sample Report
          </a>
          <a href="/login" className="hover:text-[#1F8A8A] transition">
            Log In
          </a>
          <a
            href="/signup"
            className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-lg hover:bg-[#b9972b] shadow-md transition"
          >
            Join InvestorIQ
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
