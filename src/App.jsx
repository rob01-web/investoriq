import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PALETTE } from '@/lib/utils';

// Layout
import MainLayout from '@/layouts/MainLayout';

// Core Pages
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import LoginPage from '@/pages/Login';
import SignUpPage from '@/pages/SignUp';
import SampleReport from '@/pages/SampleReport';
import Contact from '@/pages/Contact';
import About from '@/pages/About';

// ✅ ADD THIS
import PricingPage from '@/pages/Pricing';
import { supabase } from '@/lib/customSupabaseClient';

function DashboardSwitch() {
  const [ready, setReady] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const adminEmail = "hello@investoriq.tech";

      if (!mounted) return;
      setIsAdmin(user?.email === adminEmail);
      setReady(true);
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null;

  return isAdmin ? <AdminDashboard /> : <Dashboard />;
}

function LegalShell({ title, effectiveLabel, children }) {
  return (
    <MainLayout>
      <div
        className="min-h-screen px-6 py-16"
        style={{ backgroundColor: PALETTE.paper }}
      >
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold" style={{ color: PALETTE.deepNavy }}>
              {title}
            </h1>
            {effectiveLabel ? (
              <div className="mt-2 text-sm text-slate-500">
                {effectiveLabel}
              </div>
            ) : null}
          </div>

          <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
  {children}
</div>

          <div className="mt-10">
            <Link
              to="/"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-opacity"
              style={{ backgroundColor: PALETTE.teal }}
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function TermsPage() {
  return (
    <LegalShell
      title="Terms of Use"
      effectiveLabel="Version: v2026-01-14"
    >
      <h2>1. Overview</h2>
      <p>
        InvestorIQ is a document-based real estate underwriting platform. Outputs are produced from
        the documents you upload. InvestorIQ is not a brokerage, appraiser, lender, or advisor.
      </p>

      <h2>2. Not advice and no reliance</h2>
      <p>
        InvestorIQ does not provide financial advice, investment advice, appraisal advice, legal advice,
        tax advice, or accounting advice. Outputs are informational only. You are responsible for
        verifying all inputs and results and for obtaining independent professional advice as needed.
      </p>

      <h2>3. Acceptance of terms and policy versioning</h2>
      <p>
       By accessing or using the InvestorIQ platform, including by uploading documents or generating
       reports, you acknowledge and agree to be bound by the then-current version of InvestorIQ’s
       Terms of Use, Privacy Policy, and Analysis Disclosures.
      </p>

      <p>
       Acceptance is provided through an explicit acknowledgment mechanism within the platform and
       applies to the specific policy versions in effect at the time of acknowledgment. Once accepted,
       such acceptance remains valid for all subsequent use of the platform unless and until the
       applicable policies are modified or replaced.
      </p>

      <p>
       InvestorIQ may update these policies from time to time. When a policy is materially updated,
       users will be required to review and explicitly acknowledge the updated version before
       continuing to use the affected features of the platform. InvestorIQ maintains audit records
       of policy acknowledgments, including the applicable policy version and acceptance timestamp,
       for compliance, security, and legal purposes.
      </p>
 
       <h2>4. Document-only and no assumptions</h2>
      <p>
        InvestorIQ does not assume, infer, normalize, or fill gaps. If inputs are missing, conflicting,
        or degraded, the limitation may be disclosed and may reduce report completeness.
      </p>

      <h2>5. Accounts and eligibility</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all
        activity under your account.
      </p>

      <h2>6. Your content and permissions</h2>
      <p>
        You represent that you have the right to upload and use the documents you provide, including
        any third-party materials. You grant InvestorIQ a limited license to process your documents
        solely to provide the service, generate outputs, and maintain security, audit, and support logs.
      </p>

      <h2>7. Payments and refunds</h2>
      <p>
        Certain features of the InvestorIQ platform require the purchase of a report for a specific property.
        Each purchase creates one entitlement that is consumed when report generation is initiated.
        Revisions apply only to the same property and the underlying document set. Submitting materially different rent rolls, T12s, or a different property requires a new report purchase.

        Because InvestorIQ provides bespoke, property-specific analytical artifacts generated from documents you provide, refunds are not available once report generation begins.

        If a report fails to generate or is incomplete due to a system or processing error caused by InvestorIQ, InvestorIQ will regenerate the report for the same property at no additional cost. This regeneration is the sole remedy for such situations and does not constitute a cash refund. Regeneration is not available for failures caused by document quality or missing inputs.

        Users are responsible for ensuring the accuracy, completeness, and suitability of uploaded documents prior to initiating report generation.
      </p>

      <h2>Refund Policy</h2>
      <p>
        InvestorIQ reports are bespoke, property-specific analytical artifacts generated from documents you provide.
        Once report generation begins, refunds are not available.
      </p>

      <h2>Regeneration Policy</h2>
      <p>
        If a report fails to generate or is incomplete due to a system or processing error caused by InvestorIQ,
        InvestorIQ will regenerate the report for the same property at no additional cost.
      </p>

      <h2>Important Disclosures</h2>
      <p>
        InvestorIQ provides document-based analytical reports only.
        Reports do not constitute investment advice, financial advice, or an appraisal.
        InvestorIQ does not introduce assumptions or inferred data.
        Missing or insufficient source data is explicitly disclosed as “DATA NOT AVAILABLE”.
      </p>

      <h2>8. Availability and changes</h2>
      <p>
        InvestorIQ may modify, suspend, or discontinue features to maintain security, compliance, or service quality.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, InvestorIQ is not liable for any indirect, incidental,
        special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, data,
        business opportunities, or goodwill arising from or related to your use of the service or outputs.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You agree to indemnify and hold InvestorIQ harmless from claims arising out of your uploaded content,
        your use of outputs, or your violation of these Terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using InvestorIQ at any time. InvestorIQ may suspend or terminate access if required
        for security, compliance, or abuse prevention.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of Ontario and the federal laws of Canada applicable therein,
        without regard to conflict of laws principles.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: <a href="mailto:hello@investoriq.tech">hello@investoriq.tech</a>
      </p>
    </LegalShell>
  );
}

function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      effectiveLabel="Effective: 2026-01-14"
    >
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
      <p>
        InvestorIQ uses service providers to operate the platform. This may include infrastructure,
        authentication, payments, and document rendering vendors (for example: Vercel, Supabase, Stripe,
        and DocRaptor). Providers process data only to deliver services to InvestorIQ.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We retain information for as long as necessary to provide the service, maintain audit and security records,
        comply with legal requirements, and resolve disputes. Retention periods may vary by data type and obligation.
      </p>

      <h2>5. Security</h2>
      <p>
        We use reasonable administrative, technical, and organizational safeguards designed to protect information.
        No method of transmission or storage is completely secure.
      </p>

      <h2>6. Your choices</h2>
      <p>
        You may request access, correction, or deletion of your account information subject to legal and operational
        requirements, including audit and security log retention.
      </p>

      <h2>7. Contact</h2>
      <p>
        Privacy questions: <a href="mailto:hello@investoriq.tech">hello@investoriq.tech</a>
      </p>
    </LegalShell>
  );
}

function DisclosuresPage() {
  return (
    <LegalShell
      title="Analysis Disclosures"
      effectiveLabel="Version: v2026-01-14"
    >
      <h2>1. Document-based outputs only</h2>
      <p>
        InvestorIQ produces underwriting outputs strictly from the documents you upload. Outputs are not created
        from external data sources unless explicitly identified as such within the report.
      </p>

      <h2>2. No assumptions and no gap-filling</h2>
      <p>
        InvestorIQ does not assume, infer, normalize, or fill missing values. If information is missing, conflicting,
        or degraded, the output may be incomplete and the limitation may be disclosed.
      </p>

      <h2>3. Not advice</h2>
      <p>
        InvestorIQ does not provide financial advice, investment advice, appraisal advice, legal advice, tax advice,
        or accounting advice. Outputs are informational and must not be relied upon as a substitute for professional judgment.
      </p>

      <h2>4. User responsibility</h2>
      <p>
        You are responsible for the accuracy, completeness, and legality of the documents you upload and for validating
        outputs before making decisions. Investment decisions involve risk and outcomes depend on factors beyond the platform.
      </p>

      <h2>5. Auditability and acceptance</h2>
      <p>
        InvestorIQ may maintain audit and security logs and may record acceptance of disclosures to support compliance,
        defensibility, and system integrity.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about disclosures: <a href="mailto:hello@investoriq.tech">hello@investoriq.tech</a>
      </p>
    </LegalShell>
  );
}

function NotFound() {
  return (
    <MainLayout>
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          background: `linear-gradient(to bottom, #ffffff, ${PALETTE.paper})`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center bg-white border border-slate-200 rounded-2xl shadow-xl p-10 max-w-md"
        >
          <h1
            className="text-4xl font-extrabold mb-3"
            style={{ color: PALETTE.deepNavy }}
          >
            Page Not Found
          </h1>

          <p className="text-slate-600 mb-8 text-base">
            The page you’re looking for doesn’t exist or has been moved.
          </p>

          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:scale-105 transition-transform"
            style={{
              background: `linear-gradient(to right, ${PALETTE.teal}, #177272)`,
            }}
          >
            Return to Home
          </Link>
        </motion.div>
      </div>
    </MainLayout>
  );
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route
        path="/"
        element={
          <MainLayout>
            <LandingPage />
          </MainLayout>
        }
      />

      <Route
        path="/login"
        element={
          <MainLayout>
            <LoginPage />
          </MainLayout>
        }
      />

      <Route
        path="/signup"
        element={
          <MainLayout>
            <SignUpPage />
          </MainLayout>
        }
      />

      <Route
        path="/sample-report"
        element={
          <MainLayout>
            <SampleReport sampleTitle="Sample Report" sampleUrl="/reports/sample.pdf" />
          </MainLayout>
        }
      />

      <Route
        path="/sample-report/screening"
        element={
          <MainLayout>
            <SampleReport sampleTitle="Screening Sample Report" sampleUrl="/samples/screening-sample.pdf" />
          </MainLayout>
        }
      />

      <Route
        path="/sample-report/underwriting"
        element={
          <MainLayout>
            <SampleReport sampleTitle="Underwriting Sample Report" sampleUrl="/samples/underwriting-sample.pdf" />
          </MainLayout>
        }
      />

      {/* ✅ ADD THIS (PUBLIC PRICING PAGE) */}
      <Route
        path="/pricing"
        element={
          <MainLayout>
            <PricingPage />
          </MainLayout>
        }
      />

      <Route
        path="/contact"
        element={
          <MainLayout>
            <Contact />
          </MainLayout>
        }
      />

      <Route
        path="/about"
        element={
          <MainLayout>
            <About />
          </MainLayout>
        }
      />

            {/* LEGAL ROUTES (PUBLIC) */}
      <Route path="/terms" element={<TermsPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/disclosures" element={<DisclosuresPage />} />

      {/* DASHBOARD (can customize later) */}
            <Route
        path="/dashboard"
        element={
          <MainLayout>
            <DashboardSwitch />
          </MainLayout>
        }
      />
      
      {/* Convenience Redirect */}
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* 404 PAGE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
