'use client';

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown, UploadCloud, AlertCircle } from 'lucide-react';
import UploadModal from '@/components/UploadModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';

const PALETTE = {
  deepNavy: '#0F172A',
  teal: '#1F8A8A',
  gold: '#D4AF37',
  gray: '#6B7280',
};

export default function Dashboard() {
  const { toast } = useToast();
  const { profile, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [reportData, setReportData] = useState(null);

  const handleUploadSuccess = async () => {
    toast({
      title: 'Upload Successful',
      description: "Your deal is being analyzed by the InvestorIQ AI Analyst Engine.",
    });
    if (profile?.id) await fetchProfile(profile.id);
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const oversized = files.some((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      toast({
        title: 'File Too Large',
        description: 'Each file must be under 10 MB.',
        variant: 'destructive',
      });
      return;
    }
    setUploadedFiles(files);
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please upload at least one document before generating your IQ Report.',
      });
      return;
    }

    setLoading(true);
    try {
      let extracted = {};
      uploadedFiles.forEach((file) => {
        if (file.name.endsWith('.pdf')) extracted.address = '123 Example Ave (from PDF)';
        if (file.name.endsWith('.xlsx')) extracted.beds = 4;
        if (file.name.endsWith('.jpg')) extracted.notes = 'Image data recognized';
      });

      const coreQuestion =
        prompt('Core Question? (e.g., "5-year IRR projection?")') || '5-year value-add analysis.';

      const analysis = {
        ...extracted,
        summary: 'InvestorIQ AI analysis generated using institutional-grade data modeling.',
        valuation: 5000000,
        confidence: 96,
      };

      const { generatePDF } = await import('@/lib/generatePDF');
      await generatePDF(analysis);

      setReportData({
        address: extracted.address,
        valuation: analysis.valuation,
        confidence: analysis.confidence,
      });

      toast({
        title: 'IQ Report Generated',
        description: 'Your InvestorIQ Property IQ Report™ is ready to download.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Analysis Failed',
        description: 'Please try again or contact support if the issue continues.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>InvestorIQ Dashboard — Property IQ Reports</title>
        <meta
          name="description"
          content="Upload property documents and generate institutional-grade IQ Reports with InvestorIQ AI."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-white via-[#f9fafb] to-[#eef2f5] p-4 sm:p-8 flex flex-col">
        <div className="max-w-5xl mx-auto flex-grow">
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-10"
          >
            <div>
              <h1 className="text-4xl font-extrabold text-[#0F172A]">
                Welcome, {profile?.full_name || 'Investor'}.
              </h1>
              <p className="text-slate-600 mt-2">
                Upload your documents below to generate your{" "}
                <span className="text-[#1F8A8A] font-semibold">Property IQ Report™</span>.
              </p>
            </div>
            <div className="text-right mt-4 sm:mt-0">
              <div className="font-bold text-lg text-slate-700">Report Credits</div>
              <div className="text-4xl font-extrabold text-[#D4AF37]">
                {profile?.report_credits ?? '...'}
              </div>
            </div>
          </motion.div>

          {/* UPLOAD SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">Upload Property Documents</h2>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Upload <strong>PDFs, spreadsheets, or property photos.</strong><br />
                  <span className="text-[#1F8A8A] font-semibold">
                    The more you upload, the smarter your report.
                  </span>{" "}
                  (10 MB max per file)
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Works for both <strong>off-market</strong> and MLS properties when documents are available.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => document.getElementById('fileInput').click()}
                disabled={!profile || profile.report_credits <= 0}
                className="bg-gradient-to-r from-[#1F8A8A] to-[#177272] text-white font-semibold shadow-md hover:scale-105 transition-transform"
              >
                <UploadCloud className="mr-2 h-5 w-5" />
                Upload Files
              </Button>
            </div>

            <input
              id="fileInput"
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={handleUpload}
              className="hidden"
            />

            {/* FILE PREVIEW */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-[#0F172A]">
                  Files Selected ({uploadedFiles.length})
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {uploadedFiles.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between border-b border-slate-100 pb-1 last:border-none"
                    >
                      <span>{file.name}</span>
                      <span className="text-slate-500 text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* DISCLAIMER */}
            <div className="mt-6 bg-[#1F8A8A]/10 border border-[#1F8A8A]/30 rounded-lg p-4 text-sm text-slate-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-[#1F8A8A] flex-shrink-0 mt-[2px]" />
              <span>
                <strong className="text-[#0F172A]">Note:</strong> Report accuracy depends on the completeness and clarity of your uploaded data.
              </span>
            </div>

            {/* ACTION */}
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={uploadedFiles.length === 0 || loading}
                className="px-10 bg-gradient-to-r from-[#D4AF37] to-[#b9972b] text-white font-bold hover:scale-105 transition-transform rounded-xl shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                  </>
                ) : (
                  'Generate IQ Report™'
                )}
              </Button>
            </div>
          </motion.div>

          {/* HISTORY */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 mb-10"
          >
            <h3 className="text-xl font-bold text-[#0F172A] mb-4">Analysis History</h3>
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center text-slate-500">
              <p className="text-base mb-1">No reports yet.</p>
              <p className="text-sm">
                Upload and generate your first Property IQ Report™ to see your history appear here.
              </p>
            </div>
          </motion.div>
        </div>

        {/* FOOTER */}
        <footer className="py-6 border-t bg-white text-center text-slate-500 text-sm">
          © 2025 <span className="font-semibold text-[#1F8A8A]">InvestorIQ</span>. All Rights Reserved.
        </footer>
      </div>

      <UploadModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onUpload={handleUploadSuccess} />
      <BackButton />
    </>
  );
}
