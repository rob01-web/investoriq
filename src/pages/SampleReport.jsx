'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileDown, BarChart3 } from 'lucide-react';

export default function SampleReport() {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('browser');
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const sampleData = {
    address: "123 Golden Avenue, Miami, FL",
    summary:
      "A high-performing Class A multifamily property offering 7.5% stabilized cap rate with exceptional tenant retention. Located in a high-demand rental corridor with strong absorption and rent growth fundamentals.",
    valuation: 7400000,
    confidence: 97,
    trend: 'Upward 9.4%',
    comps: 'Recent comparable sales: $7.2M, $7.8M, $8.0M (past 60 days)',
    risks: {
      low: 'Tenant quality',
      medium: 'Renovation ROI',
      high: 'Interest rate sensitivity',
    },
  };

  useEffect(() => {
    setTimeout(() => {
      setDataLoaded(true);
    }, 600);
  }, []);

  const handleView = (mode) => {
    setError(null);
    setViewMode(mode);
    if (mode === 'pdf') {
      setLoading(true);
      handlePDFDownload();
    }
  };

  const handlePDFDownload = async () => {
    try {
      const module = await import('@/lib/generatePDF');
      const { generatePDF } = module;
      await generatePDF(sampleData);
      alert('InvestorIQ Property IQ Report™ downloaded successfully.');
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(
        `PDF generation failed: ${err.message}. Check if generatePDF.js exists and pdfmake is installed.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-slate-600 text-lg">
        <Loader2 className="animate-spin h-6 w-6 mb-3" />
        Loading your sample Property IQ Report™...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F9FAFB] to-[#EEF2F5] p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-[#0F172A] mb-2 text-center">
          InvestorIQ Property IQ Report™
        </h1>
        <p className="text-center text-slate-500 mb-10">
          Verified by the <span className="font-semibold text-[#1F8A8A]">InvestorIQ AI Analyst Engine</span>
        </p>

        {/* Buttons */}
        <div className="text-center mb-8">
          <button
            onClick={() => handleView('browser')}
            disabled={viewMode === 'browser'}
            className="mr-4 px-6 py-3 bg-[#1F8A8A] text-white rounded-lg shadow-md hover:scale-105 transition disabled:opacity-50"
          >
            View in Browser
          </button>
          <button
            onClick={() => handleView('pdf')}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#b9972b] text-white rounded-lg shadow-md hover:scale-105 transition disabled:opacity-50"
          >
            {loading ? 'Generating PDF...' : 'Download IQ Report™'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {/* Browser View */}
        {viewMode === 'browser' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-10 border border-slate-200"
          >
            <div className="space-y-6">
              {/* Property Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-[#0F172A] mb-1">{sampleData.address}</h2>
                <p className="text-[#1F8A8A] font-medium">Sample Property IQ Report™</p>
              </div>

              {/* Metrics Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-r from-[#FDF8E7] to-[#FFFDF5] border border-[#E2E8F0] p-6 rounded-xl">
                <div className="text-center">
                  <p className="text-sm text-slate-600">AI Valuation</p>
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    ${sampleData.valuation.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Confidence Level</p>
                  <p className="text-3xl font-bold text-[#1F8A8A]">
                    {sampleData.confidence}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Market Trend</p>
                  <p className="text-xl font-semibold text-[#0F172A]">{sampleData.trend}</p>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-3">Executive Summary</h3>
                <p className="text-slate-700 leading-relaxed">{sampleData.summary}</p>
              </div>

              {/* Risk Matrix */}
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-3">Risk Overview</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-[#1F8A8A]/10">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">Category</th>
                      <th className="border border-gray-300 p-3 text-left">Risk Level</th>
                      <th className="border border-gray-300 p-3 text-left">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-green-50">
                      <td className="border border-gray-300 p-3">Tenant Quality</td>
                      <td className="border border-gray-300 p-3">Low</td>
                      <td className="border border-gray-300 p-3">Strong income reliability</td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="border border-gray-300 p-3">Renovation ROI</td>
                      <td className="border border-gray-300 p-3">Medium</td>
                      <td className="border border-gray-300 p-3">Balanced return</td>
                    </tr>
                    <tr className="bg-red-50">
                      <td className="border border-gray-300 p-3">Interest Rate Sensitivity</td>
                      <td className="border border-gray-300 p-3">High</td>
                      <td className="border border-gray-300 p-3">Refinance exposure</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Market Comps */}
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-3">Market Comparables</h3>
                <p className="text-slate-700">{sampleData.comps}</p>
              </div>
            </div>

            <div className="mt-10 text-center text-sm text-slate-500">
              <BarChart3 className="inline-block h-5 w-5 mr-1 text-[#D4AF37]" />
              Verified by <span className="font-semibold text-[#1F8A8A]">InvestorIQ AI Analyst Engine</span>
            </div>
          </motion.div>
        )}

        {/* PDF Confirmation */}
        {viewMode === 'pdf' && !loading && (
          <div className="text-center mt-10 text-slate-700 text-lg">
            ✅ Your Property IQ Report™ has been generated. Check your downloads folder.
          </div>
        )}
      </motion.div>
    </div>
  );
}
