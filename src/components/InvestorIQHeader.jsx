import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { PALETTE } from "@/lib/utils";

// ─── DESIGN TOKENS (local, mirrors PALETTE for clarity) ──────
const T = {
  green:    "#0F2318",
  gold:     "#C9A84C",
  goldDark: "#9A7A2C",
  ink:      "#0C0C0C",
  white:    "#FFFFFF",
  hairline: "#E8E5DF",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

export default function InvestorIQHeader() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollY } = useScroll();

  // Header becomes slightly more opaque + tighter on scroll
  const headerPy = useTransform(scrollY, [0, 80], ["14px", "10px"]);
  const headerShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 1px 0 rgba(15,35,24,0)", "0 2px 16px rgba(15,35,24,0.18)"]
  );

  const navLinks = [
    { href: "/pricing", label: "Pricing" },
    { href: "/about",   label: "About"   },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <style>{FONTS}</style>

      <motion.header
        style={{
          boxShadow: headerShadow,
          paddingTop:    headerPy,
          paddingBottom: headerPy,
        }}
        className="w-full sticky top-0 z-50"
        css={{
          backgroundColor: T.green,
          borderBottom: `1px solid rgba(201,168,76,0.12)`,
        }}
        // Tailwind bg fallback
        data-header="investoriq"
      >
        {/* Force green background via inline style — survives Tailwind purge */}
        <div
          style={{
            position:    "absolute",
            inset:       0,
            background:  T.green,
            borderBottom:`1px solid rgba(201,168,76,0.12)`,
            zIndex:      0,
          }}
        />

        {/* Vertical gold thread — left */}
        <div style={{
          position:   "absolute",
          top: 0, bottom: 0, left: 32,
          width:      1,
          background: "linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.35) 20%, rgba(201,168,76,0.35) 80%, transparent 100%)",
          pointerEvents: "none",
          zIndex:     1,
        }} />

        <div
          style={{ position: "relative", zIndex: 2 }}
          className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-10"
        >

          {/* WORDMARK */}
          <a
            href="/"
            aria-label="InvestorIQ home"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            <span style={{
              fontFamily:   "'Cormorant Garamond', Georgia, serif",
              fontSize:     14,
              fontWeight:   600,
              letterSpacing:"0.2em",
              textTransform:"uppercase",
              color:        T.gold,
              lineHeight:   1,
            }}>
              InvestorIQ
            </span>
          </a>

          {/* DESKTOP NAV */}
          <nav
            className="hidden sm:flex items-center"
            style={{ gap: 24 }}
          >
            {!user && navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href}>{label}</NavLink>
            ))}

            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = "/login";
                }}
                style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     10,
                  letterSpacing:"0.14em",
                  textTransform:"uppercase",
                  fontWeight:   500,
                  padding:      "8px 18px",
                  background:   "transparent",
                  color:        "rgba(255,255,255,0.5)",
                  border:       "1px solid rgba(255,255,255,0.18)",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                  e.currentTarget.style.color = T.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }}
              >
                Log out
              </button>
            ) : (
              <>
                <NavLink href="/login">Log In</NavLink>
                <CTAButton href="/signup">Get Started</CTAButton>
              </>
            )}
          </nav>

          {/* MOBILE MENU TOGGLE */}
          <button
            className="flex flex-col sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            style={{
              background:  "transparent",
              border:      "none",
              cursor:      "pointer",
              padding:     "4px",
              gap:         5,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                display:    "block",
                width:      22,
                height:     1.5,
                background: mobileOpen ? T.gold : "rgba(255,255,255,0.6)",
                transition: "all 0.2s",
                transformOrigin: "center",
                transform:
                  mobileOpen && i === 0 ? "rotate(45deg) translateY(6.5px)"
                  : mobileOpen && i === 1 ? "scaleX(0)"
                  : mobileOpen && i === 2 ? "rotate(-45deg) translateY(-6.5px)"
                  : "none",
              }} />
            ))}
          </button>
        </div>

        {/* MOBILE DROPDOWN */}
        {mobileOpen && (
          <div
            style={{
              position:   "relative",
              zIndex:     2,
              background: T.green,
              borderTop:  "1px solid rgba(201,168,76,0.12)",
            }}
            className="sm:hidden"
          >
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
              {!user && navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontFamily:   "'DM Mono', monospace",
                    fontSize:     10,
                    letterSpacing:"0.16em",
                    textTransform:"uppercase",
                    color:        "rgba(255,255,255,0.5)",
                    padding:      "10px 0",
                    borderBottom: "1px solid rgba(201,168,76,0.08)",
                    textDecoration:"none",
                  }}
                >
                  {label}
                </a>
              ))}
              {!user && (
                <>
                  <a href="/login" onClick={() => setMobileOpen(false)} style={{
                    fontFamily:   "'DM Mono', monospace",
                    fontSize:     10,
                    letterSpacing:"0.16em",
                    textTransform:"uppercase",
                    color:        "rgba(255,255,255,0.5)",
                    padding:      "10px 0",
                    borderBottom: "1px solid rgba(201,168,76,0.08)",
                    textDecoration:"none",
                  }}>
                    Log In
                  </a>
                  <a href="/signup" onClick={() => setMobileOpen(false)} style={{
                    fontFamily:   "'DM Mono', monospace",
                    fontSize:     10,
                    letterSpacing:"0.14em",
                    textTransform:"uppercase",
                    fontWeight:   500,
                    padding:      "10px 18px",
                    background:   T.gold,
                    color:        T.green,
                    textDecoration:"none",
                    display:      "inline-block",
                    marginTop:    8,
                    alignSelf:    "flex-start",
                  }}>
                    Get Started
                  </a>
                </>
              )}
              {user && (
                <button
                  onClick={async () => { await signOut(); window.location.href = "/login"; }}
                  style={{
                    fontFamily:   "'DM Mono', monospace",
                    fontSize:     10,
                    letterSpacing:"0.14em",
                    textTransform:"uppercase",
                    padding:      "10px 18px",
                    background:   "transparent",
                    color:        "rgba(255,255,255,0.5)",
                    border:       "1px solid rgba(255,255,255,0.18)",
                    cursor:       "pointer",
                    alignSelf:    "flex-start",
                    marginTop:    8,
                  }}
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        )}

      </motion.header>
    </>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function NavLink({ href, children }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily:   "'DM Mono', monospace",
        fontSize:     10,
        letterSpacing:"0.16em",
        textTransform:"uppercase",
        color:        hov ? "#C9A84C" : "rgba(255,255,255,0.45)",
        textDecoration:"none",
        transition:   "color 0.15s",
      }}
    >
      {children}
    </a>
  );
}

function CTAButton({ href, children }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily:   "'DM Mono', monospace",
        fontSize:     10,
        letterSpacing:"0.14em",
        textTransform:"uppercase",
        fontWeight:   500,
        padding:      "8px 18px",
        background:   hov ? "rgba(201,168,76,0.88)" : "#C9A84C",
        color:        "#0F2318",
        textDecoration:"none",
        transition:   "background 0.15s",
        display:      "inline-block",
      }}
    >
      {children}
    </a>
  );
}
