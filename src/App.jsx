import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PALETTE } from '@/lib/utils';

// Layout
import MainLayout from '@/layouts/MainLayout';

// Core Pages
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/pages/Login';
import SignUpPage from '@/pages/SignUp';
import SampleReport from '@/pages/SampleReport';
import CheckoutSuccess from '@/pages/CheckoutSuccess';

// ✅ ADD THIS
import PricingPage from '@/pages/Pricing';

function LegalShell({ title, children }) {
  return (
    <MainLayout>
      <div
        className="min-h-screen px-6 py-16"
        style={{ background: `linear-gradient(to bottom, #ffffff, ${PALETTE.paper})` }}
      >
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-10">
          <h1 className="text-3xl font-extrabold mb-6" style={{ color: PALETTE.deepNavy }}>
            {title}
          </h1>
          <div className="prose prose-slate max-w-none">
            {children}
          </div>
          <div className="mt-10">
            <Link
              to="/"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:scale-105 transition-transform"
              style={{ background: `linear-gradient(to right, ${PALETTE.teal}, #177272)` }}
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function TermsPagePlaceholder() {
  return (
    <LegalShell title="Terms of Use">
      <p>
        This page will contain the InvestorIQ Terms of Use. Until final terms are published, do not rely on this page for legal guidance.
      </p>
    </LegalShell>
  );
}

function PrivacyPagePlaceholder() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        This page will contain the InvestorIQ Privacy Policy. Until final policy is published, do not rely on this page for privacy disclosures.
      </p>
    </LegalShell>
  );
}

function DisclosuresPagePlaceholder() {
  return (
    <LegalShell title="Analysis Disclosures">
      <p>
        InvestorIQ outputs are produced strictly from documents uploaded by the user. The system does not assume, infer, normalize, or fill gaps.
      </p>
      <p>
        Missing, conflicting, or degraded source data is disclosed. Users remain responsible for decisions and outcomes.
      </p>
      <p>
        InvestorIQ does not provide financial, legal, appraisal, or investment advice.
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
          <MainLayout showFooter={false}>
            <LoginPage />
          </MainLayout>
        }
      />

      <Route
        path="/signup"
        element={
          <MainLayout showFooter={false}>
            <SignUpPage />
          </MainLayout>
        }
      />

      <Route
        path="/sample-report"
        element={
          <MainLayout>
            <SampleReport />
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

      {/* CHECKOUT SUCCESS */}
      <Route
        path="/checkout/success"
        element={
          <MainLayout showFooter={false}>
            <CheckoutSuccess />
          </MainLayout>
        }
      />

            {/* LEGAL ROUTES (PUBLIC) */}
      <Route path="/terms" element={<TermsPagePlaceholder />} />
      <Route path="/privacy" element={<PrivacyPagePlaceholder />} />
      <Route path="/disclosures" element={<DisclosuresPagePlaceholder />} />

      {/* DASHBOARD (can customize later) */}
      <Route
        path="/dashboard"
        element={
          <MainLayout>
            <Dashboard />
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
