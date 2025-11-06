'use client';

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FilePlus, FileDown } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const logoUrl = "https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png";

  const generateMockReport = () => {
    return {
      id: Date.now(),
      address: `Admin Test Property #${reports.length + 1}`,
      valuation: Math.floor(Math.random() * 5000000) + 1000000,
      confidence: Math.floor(Math.random() * 10) + 90,
      status: 'Ready for Elite Analysis',
      timestamp: new Date().toLocaleString()
    };
  };

  const addReport = () => {
    const newReport = generateMockReport();
    setReports([newReport, ...reports]);
  };

  return (
    <>
      <Helmet>
        <title>Admin Control - InvestorIQ</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">
            InvestorIQ Admin Control Center
          </h1>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-center">
            <button
              onClick={addReport}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              + Generate Test Report
            </button>
          </div>

          <div className="space-y-6">
            {reports.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-xl">No reports. Click above to test workflow.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{report.address}</h3>
                    <p className="text-sm text-gray-600">Generated: {report.timestamp}</p>
                    <p className="mt-2">
                      <span className="font-semibold">Value:</span> ${report.valuation.toLocaleString()} | 
                      <span className="ml-3 font-semibold">Confidence:</span> {report.confidence}%
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const { generatePDF } = await import('@/lib/docGenerator');
                        await generatePDF({
                          ...report,
                          summary: `Admin test for ${report.address}. Off-market elite analysis: High ROI potential, low risks.`,
                          trend: 'Bullish Off-Market',
                          comps: '3 off-market deals: $4.2M, $4.8M, $5.1M (private sources).'
                        });
                        alert("ADMIN ELITE REPORT DOWNLOADED!");
                      } catch (err) {
                        console.error(err);
                        alert("PDF failed");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 hover:shadow-lg transition"
                  >
                    {loading ? '...' : 'PUBLISH ELITE'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}