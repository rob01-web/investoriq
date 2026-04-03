import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Layout
import MainLayout from '@/layouts/MainLayout';

// Core Pages
import LandingPage    from '@/pages/LandingPage';
import Dashboard      from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import LoginPage      from '@/pages/Login';
import SignUpPage     from '@/pages/SignUp';
import Contact        from '@/pages/Contact';
import About          from '@/pages/About';
import PricingPage    from '@/pages/Pricing';
import { supabase }   from '@/lib/customSupabaseClient';

// ─── DESIGN TOKENS ────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  goldDark: '#9A7A2C',
  ink:      '#0C0C0C',
  ink3:     '#606060',
  ink4:     '#9A9A9A',
  white:    '#FFFFFF',
  warm:     '#FAFAF8',
  hairline: '#E8E5DF',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

// ─── DASHBOARD SWITCH (admin vs user) ────────────────────────
function DashboardSwitch() {
  const [ready, setReady]   = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = "hello@investoriq.tech";
      if (!mounted) return;
      setIsAdmin(user?.email === adminEmail);
      setReady(true);
    };
    run();
    return () => { mounted = false; };
  }, []);

  if (!ready) return null;
  return isAdmin ? <AdminDashboard /> : <Dashboard />;
}

// ─── LEGAL SHELL ─────────────────────────────────────────────
function LegalShell({ title, effectiveLabel, children }) {
  return (
    <MainLayout>
      <style>{FONTS}</style>
      <div style={{ minHeight: '100vh', background: T.warm, fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header band */}
        <div style={{
          background: T.green, position: 'relative', overflow: 'hidden',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
        }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 48, width: 1,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.35) 15%, rgba(201,168,76,0.35) 85%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          <div style={{ maxWidth: '88rem', margin: '0 auto', padding: '48px 48px 40px' }}>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.45)', marginBottom: 10,
            }}>
              InvestorIQ — Legal
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 500,
              letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.05,
              marginBottom: effectiveLabel ? 8 : 0,
            }}>
              {title}
            </h1>
            {effectiveLabel && (
              <p style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9,
                letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)',
              }}>
                {effectiveLabel}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '56px 48px 80px' }}>
          <div style={{
            background: T.white,
            border: `1px solid ${T.hairline}`,
            padding: '48px 52px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="legal-content">
              <style>{`
                .legal-content h2 {
                  font-family: 'Cormorant Garamond', Georgia, serif;
                  font-size: 18px;
                  font-weight: 500;
                  letter-spacing: -0.01em;
                  color: ${T.ink};
                  margin-top: 8px;
                  margin-bottom: 6px;
                  padding-bottom: 6px;
                  border-bottom: 1px solid ${T.hairline};
                }
                .legal-content p, .legal-content li {
                  font-family: 'DM Sans', sans-serif;
                  font-size: 14px;
                  font-weight: 300;
                  color: ${T.ink3};
                  line-height: 1.75;
                }
                .legal-content ul, .legal-content ol {
                  padding-left: 20px;
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                }
                .legal-content a {
                  color: ${T.goldDark};
                  font-family: 'DM Mono', monospace;
                  font-size: 12px;
                  letter-spacing: 0.06em;
                }
                .legal-content a:hover { color: ${T.gold}; }
              `}</style>
              {children}
            </div>

            <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${T.hairline}` }}>
              <Link
                to="/"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                  fontWeight: 500, padding: '11px 24px',
                  background: T.green, color: T.gold,
                  border: `1px solid ${T.green}`, textDecoration: 'none',
                  display: 'inline-block', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = T.green; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = T.green; e.currentTarget.style.color = T.gold; }}
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ─── LEGAL PAGES ─────────────────────────────────────────────
function TermsPage() {
  return (
    <LegalShell title="Terms of Use" effectiveLabel="Version: v2026-01-14">
      <h2>1. Overview</h2>
      <p>InvestorIQ is a document-based real estate underwriting platform. Outputs are produced from the documents you upload. InvestorIQ is not a brokerage, appraiser, lender, or advisor.</p>
      <h2>2. Not advice and no reliance</h2>
      <p>InvestorIQ does not provide financial advice, investment advice, appraisal advice, legal advice, tax advice, or accounting advice. Outputs are informational only. You are responsible for verifying all inputs and results and for obtaining independent professional advice as needed.</p>
      <h2>3. Acceptance of terms and policy versioning</h2>
      <p>By accessing or using the InvestorIQ platform, including by uploading documents or generating reports, you acknowledge and agree to be bound by the then-current version of InvestorIQ's Terms of Use, Privacy Policy, and Analysis Disclosures.</p>
      <p>Acceptance is provided through an explicit acknowledgment mechanism within the platform and applies to the specific policy versions in effect at the time of acknowledgment. Once accepted, such acceptance remains valid for all subsequent use of the platform unless and until the applicable policies are modified or replaced.</p>
      <p>InvestorIQ may update these policies from time to time. When a policy is materially updated, users will be required to review and explicitly acknowledge the updated version before continuing to use the affected features of the platform. InvestorIQ maintains audit records of policy acknowledgments, including the applicable policy version and acceptance timestamp, for compliance, security, and legal purposes.</p>
      <h2>4. Document-only and no assumptions</h2>
      <p>InvestorIQ does not assume, infer, normalize, or fill gaps. If inputs are missing, conflicting, or degraded, the limitation may be disclosed and may reduce report completeness.</p>
      <h2>5. Accounts and eligibility</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</p>
      <h2>6. Your content and permissions</h2>
      <p>You represent that you have the right to upload and use the documents you provide, including any third-party materials. You grant InvestorIQ a limited license to process your documents solely to provide the service, generate outputs, and maintain security, audit, and support logs.</p>
      <h2>7. Payments and refunds</h2>
      <p>Certain features of the InvestorIQ platform require the purchase of a report for a specific property.</p>
      <ul>
        <li>One generation per purchase (per property).</li>
        <li>Upload the correct T12 + Rent Roll before generating.</li>
        <li>If a report fails due to an InvestorIQ processing error, use "Report an issue" in the dashboard.</li>
        <li>User upload issues (wrong/missing docs) require a new purchase.</li>
      </ul>
      <h2>Refund Policy</h2>
      <p>InvestorIQ reports are bespoke, property-specific analytical artifacts generated from documents you provide. Once report generation begins, refunds are not available.</p>
      <h2>Regeneration Policy</h2>
      <p>If a report fails to generate or is incomplete due to a system or processing error caused by InvestorIQ, InvestorIQ will regenerate the report for the same property at no additional cost.</p>
      <h2>Important Disclosures</h2>
      <p>InvestorIQ provides document-based analytical reports only. Reports do not constitute investment advice, financial advice, or an appraisal. InvestorIQ does not introduce assumptions or inferred data. Missing or insufficient source data is explicitly disclosed as "DATA NOT AVAILABLE".</p>
      <h2>8. Availability and changes</h2>
      <p>InvestorIQ may modify, suspend, or discontinue features to maintain security, compliance, or service quality.</p>
      <h2>9. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, InvestorIQ is not liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, data, business opportunities, or goodwill arising from or related to your use of the service or outputs.</p>
      <h2>10. Indemnity</h2>
      <p>You agree to indemnify and hold InvestorIQ harmless from claims arising out of your uploaded content, your use of outputs, or your violation of these Terms.</p>
      <h2>11. Termination</h2>
      <p>You may stop using InvestorIQ at any time. InvestorIQ may suspend or terminate access if required for security, compliance, or abuse prevention.</p>
      <h2>12. Governing law</h2>
      <p>These Terms are governed by the laws of Ontario and the federal laws of Canada applicable therein, without regard to conflict of laws principles.</p>
      <h2>13. Contact</h2>
      <p>Questions about these Terms: <a href="mailto:support@investoriq.tech">support@investoriq.tech</a></p>
    </LegalShell>
  );
}

function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" effectiveLabel="Effective: 2026-01-14">
      <h2>1. What we collect</h2>
      <ul>
        <li>Account information (name, email)</li>
        <li>Uploaded documents and associated metadata (file name, type, size)</li>
        <li>Usage and security logs (timestamps, actions, IP address, user agent)</li>
        <li>Payment-related metadata from Stripe (we do not store full card details)</li>
      </ul>
      <h2>2. How we use information</h2>
      <ul>
        <li>To provide the service and generate document-based outputs</li>
        <li>To maintain auditability and legal acceptance records</li>
        <li>To prevent fraud, abuse, and unauthorized access</li>
        <li>To provide support and troubleshoot errors</li>
        <li>To comply with legal obligations</li>
      </ul>
      <h2>3. Service providers</h2>
      <p>InvestorIQ uses service providers to operate the platform. This may include infrastructure, authentication, payments, and document rendering vendors (for example: Vercel, Supabase, Stripe, and DocRaptor). Providers process data only to deliver services to InvestorIQ.</p>
      <h2>4. Data retention</h2>
      <p>We retain information for as long as necessary to provide the service, maintain audit and security records, comply with legal requirements, and resolve disputes. Retention periods may vary by data type and obligation.</p>
      <h2>5. Security</h2>
      <p>We use reasonable administrative, technical, and organizational safeguards designed to protect information. No method of transmission or storage is completely secure.</p>
      <h2>6. Your choices</h2>
      <p>You may request access, correction, or deletion of your account information subject to legal and operational requirements, including audit and security log retention.</p>
      <h2>7. Contact</h2>
      <p>Privacy questions: <a href="mailto:support@investoriq.tech">support@investoriq.tech</a></p>
    </LegalShell>
  );
}

function DisclosuresPage() {
  return (
    <LegalShell title="Analysis Disclosures" effectiveLabel="Version: v2026-01-14">
      <h2>1. Document-based outputs only</h2>
      <p>InvestorIQ produces underwriting outputs strictly from the documents you upload. Outputs are not created from external data sources unless explicitly identified as such within the report.</p>
      <h2>2. No assumptions and no gap-filling</h2>
      <p>InvestorIQ does not assume, infer, normalize, or fill missing values. If information is missing, conflicting, or degraded, the output may be incomplete and the limitation may be disclosed.</p>
      <h2>3. Not advice</h2>
      <p>InvestorIQ does not provide financial advice, investment advice, appraisal advice, legal advice, tax advice, or accounting advice. Outputs are informational and must not be relied upon as a substitute for professional judgment.</p>
      <h2>4. User responsibility</h2>
      <p>You are responsible for the accuracy, completeness, and legality of the documents you upload and for validating outputs before making decisions. Investment decisions involve risk and outcomes depend on factors beyond the platform.</p>
      <h2>5. Auditability and acceptance</h2>
      <p>InvestorIQ may maintain audit and security logs and may record acceptance of disclosures to support compliance, defensibility, and system integrity.</p>
      <h2>6. Contact</h2>
      <p>Questions about disclosures: <a href="mailto:support@investoriq.tech">support@investoriq.tech</a></p>
    </LegalShell>
  );
}

// ─── 404 PAGE ─────────────────────────────────────────────────
function NotFound() {
  return (
    <MainLayout>
      <style>{FONTS}</style>
      <div style={{
        minHeight: '100vh', background: T.warm,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', fontFamily: "'DM Sans', sans-serif",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: T.white,
            border: `1px solid ${T.hairline}`,
            borderTop: `3px solid ${T.green}`,
            padding: '48px',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: T.goldDark, marginBottom: 14,
          }}>
            404 — Page Not Found
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em',
            color: T.ink, lineHeight: 1.1, marginBottom: 16,
          }}>
            This page doesn't exist.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 300, color: T.ink3,
            lineHeight: 1.65, marginBottom: 32,
          }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
              fontWeight: 500, padding: '11px 28px',
              background: T.green, color: T.gold,
              border: `1px solid ${T.green}`, textDecoration: 'none',
              display: 'inline-block', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = T.green; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = T.green; e.currentTarget.style.color = T.gold; }}
          >
            Return to Home
          </Link>
        </motion.div>
      </div>
    </MainLayout>
  );
}

// ─── ROUTER ───────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/"        element={<MainLayout><LandingPage /></MainLayout>} />
      <Route path="/login"   element={<MainLayout><LoginPage /></MainLayout>} />
      <Route path="/signup"  element={<MainLayout><SignUpPage /></MainLayout>} />
      <Route path="/pricing" element={<MainLayout><PricingPage /></MainLayout>} />
      <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
      <Route path="/about"   element={<MainLayout><About /></MainLayout>} />

      {/* LEGAL */}
      <Route path="/terms"       element={<TermsPage />} />
      <Route path="/privacy"     element={<PrivacyPage />} />
      <Route path="/disclosures" element={<DisclosuresPage />} />

      {/* APP */}
      <Route path="/dashboard" element={<MainLayout><DashboardSwitch /></MainLayout>} />

      {/* REDIRECTS */}
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
