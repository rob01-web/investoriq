'use client';

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:scale-105 transition-transform"
            style={{
              background: `linear-gradient(to right, ${PALETTE.teal}, #177272)`,
            }}
          >
            Return to Home
          </a>
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
            <SampleReport />
          </MainLayout>
        }
      />

      {/* CHECKOUT SUCCESS */}
      <Route
        path="/checkout/success"
        element={
          <MainLayout>
            <CheckoutSuccess />
          </MainLayout>
        }
      />

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
