import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function InvestorIQHeader() {
  const { user, signOut } = useAuth();
  const IS_SAMPLE_REPORT = false;

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
          <a href="/" className="inline-flex items-center gap-3">
            <picture>
              <source srcSet="/brand/logo-wordmark.svg" media="(max-width: 640px)" />
              <img src="/brand/logo-primary.svg" alt="InvestorIQ" className="h-9 sm:h-10 w-auto" loading="eager" />
            </picture>
          </a>
        </motion.div>

        {/* NAVIGATION */}
        <nav className="flex items-center gap-6 text-sm font-semibold text-[#0F172A]">
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                window.location.href = "/login";
              }}
              className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1326]"
            >
              Log out
            </button>
          ) : (
            <>
              <a href="/pricing" className="hover:text-[#1F8A8A] transition">
                Pricing
              </a>

              <a href="/about" className="hover:text-[#1F8A8A] transition">
                About
              </a>

              <a href="/contact" className="hover:text-[#1F8A8A] transition">
                Contact
              </a>

              <a href="/login" className="hover:text-[#1F8A8A] transition">
                Log In
              </a>

              <a
                href="/signup"
                className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1326] hover:text-white"
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
