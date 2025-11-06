'use client';

import { useState, useEffect } from 'react';

export default function SampleReport() {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('browser');
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const sampleData = {
    address: "123 Luxury Lane, Beverly Hills, CA",
    summary: "Ultra-premium 5-bed, 6-bath estate with panoramic city views. Recently renovated with smart home tech, infinity pool, and 3-car garage. Walking distance to Rodeo Drive.",
    valuation: 8500000,
    confidence: 97,
    trend: 'Strong upward momentum',
    comps: 'Recent sales: $8.1M, $8.7M, $9.2M – all within 60 days',
    risks: { low: 'Location premium', medium: 'Renovation ROI', high: 'Market volatility' }
  };

  useEffect(() => {
    setTimeout(() => {
      setDataLoaded(true);
    }, 500);
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
      console.log('Starting PDF download - attempting dynamic import...');
      const module = await import('@/lib/docGenerator');
      console.log('Module imported:', module);
      const { generatePDF } = module;
      console.log('generatePDF function loaded:', generatePDF);
      await generatePDF(sampleData);
      console.log('generatePDF called successfully');
      alert("SAMPLE ELITE REPORT DOWNLOADED!");
    } catch (err) {
      console.error('Full PDF Error Stack:', err);
      setError(`PDF generation failed: ${err.message}. Check if docGenerator.js exists and pdfmake is installed.`);
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded) {
    return <div className="text-center p-8">Loading elite sample...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">
          Sample Elite Report
        </h1>

        <div className="text-center mb-6">
          <button 
            onClick={() => handleView('browser')} 
            disabled={viewMode === 'browser'}
            className="mr-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            View in Browser
          </button>
          <button 
            onClick={() => handleView('pdf')} 
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {viewMode === 'browser' && (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">{sampleData.address}</h2>
                <p className="text-gray-600 mt-2">Sample Premium Property</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">AI Valuation</p>
                  <p className="text-3xl font-bold text-blue-700">
                    ${sampleData.valuation.toLocaleString()}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${sampleData.confidence}%` }}></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-3xl font-bold text-green-600">{sampleData.confidence}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Market Trend</p>
                  <p className="text-xl font-semibold text-blue-700">{sampleData.trend}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed">{sampleData.summary}</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Risk Heat Map</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 p-3 text-left">Risk</th>
                      <th className="border border-gray-300 p-3 text-left">Level</th>
                      <th className="border border-gray-300 p-3 text-left">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-green-100">
                      <td className="border border-gray-300 p-3">Location Premium</td>
                      <td className="border border-gray-300 p-3">Low</td>
                      <td className="border border-gray-300 p-3">High Upside</td>
                    </tr>
                    <tr className="bg-yellow-100">
                      <td className="border border-gray-300 p-3">Renovation ROI</td>
                      <td className="border border-gray-300 p-3">Medium</td>
                      <td className="border border-gray-300 p-3">Balanced</td>
                    </tr>
                    <tr className="bg-red-100">
                      <td className="border border-gray-300 p-3">Market Volatility</td>
                      <td className="border border-gray-300 p-3">High</td>
                      <td className="border border-gray-300 p-3">Mitigate with Comps</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Market Comps</h3>
                <p className="text-gray-700">{sampleData.comps}</p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'pdf' && !loading && (
          <div className="text-center">
            <p className="text-xl text-gray-600">PDF Generated – Check Downloads!</p>
          </div>
        )}
      </div>
    </div>
  );
}