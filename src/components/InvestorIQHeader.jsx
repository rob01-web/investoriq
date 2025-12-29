import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function InvestorIQHeader() {
  const logoUrl = "/assets/logo.png";
  const { user, signOut } = useAuth();

  // Scroll-based effects
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 200], [1, 0.85]);
  const headerBg = useTransform(scrollY, [0, 200], ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.98)"]);
  const shadowOpacity = useTransform(scrollY, [0, 200], [0, 0.25]);

  return (
    <motion.header
      style={{
        backgroundColor: headerBg,
        boxShadow: `0 4px 16px rgba(0,0,0,${shadowOpacity.get()})`,
      }}
      className="w-full backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 sm:px-10">
        
        {/* LOGO — always return home */}
        <motion.div
          onClick={() => (window.location.href = "/")}
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
          <a
            href="/reports/sample-report.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1F8A8A] transition"
          >
            Sample Report
          </a>

          {user ? (
            <button
              onClick={async () => {
                await signOut();
                window.location.href = "/login";
              }}
              className="inline-flex items-center rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Log out
            </button>
          ) : (
            <>
              <a href="/login" className="hover:text-[#1F8A8A] transition">
                Log In
              </a>

              <a
                href="/signup"
                className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-lg hover:bg-[#b9972b] shadow-md transition"
              >
                Join InvestorIQ
              </a>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
