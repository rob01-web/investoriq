import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// If your project uses the @ alias, keep these.
// If not, change to relative imports like '../pages/LandingPage'
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/pages/Login';
import SignUpPage from '@/pages/SignUp';
import SampleReport from '@/pages/SampleReport';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-600 mb-6">Let’s get you back to safety.</p>
        <a
          href="/"
          className="inline-block px-5 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#1F8A8A] to-[#177272] hover:opacity-90 transition"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/sample-report" element={<SampleReport />} />
      {/* convenience redirects */}
      <Route path="/home" element={<Navigate to="/" replace />} />
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
