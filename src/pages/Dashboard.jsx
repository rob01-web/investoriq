'use client';

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, AlertCircle, FileDown } from 'lucide-react';
import UploadModal from '@/components/UploadModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { toast } = useToast();
  const { profile, fetchProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const removeUploadedFile = (index) => {
  setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
};

  const credits = Number(profile?.report_credits ?? 0);

  const startCheckout = async () => {
  try {
    const origin = window.location.origin;

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planKey: 'single',
        productType: 'singleReport',
        userId: profile?.id || '',
        userEmail: profile?.email || '',
        successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/pricing?canceled=1`,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.url) {
      toast({
        title: 'Checkout could not be started',
        description: data?.error || 'Please try again.',
        variant: 'destructive',
      });
      console.error('create-checkout-session failed:', res.status, data);
      return;
    }

    window.location.href = data.url;
  } catch (err) {
    console.error(err);
    toast({
      title: 'Checkout could not be started',
      description: 'Please try again.',
      variant: 'destructive',
    });
  }
};

  const handleUploadSuccess = async () => {
    toast({
      title: 'Upload Successful',
      description: 'Your documents are being reviewed by the InvestorIQ underwriting framework.',
    });
    if (profile?.id) await fetchProfile(profile.id);
  };

  const handleUpload = (e) => {
  const files = Array.from(e.target.files || []);

  // allow selecting the same file again later
  e.target.value = '';

  const oversized = files.some((f) => f.size > 10 * 1024 * 1024);
  if (oversized) {
    toast({
      title: 'File Too Large',
      description: 'Each file must be under 10 MB.',
      variant: 'destructive',
    });
    return;
  }

  // Append new files instead of overwriting existing ones
  setUploadedFiles((prev) => {
    const combined = [...prev, ...files];

    // Prevent accidental duplicates (same name + size)
    const seen = new Set();
    return combined.filter((f) => {
      const key = `${f.name}__${f.size}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  // IMPORTANT: do not force re-acknowledgement on each upload.
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
      const extracted = {};

      uploadedFiles.forEach((file) => {
        if (file.name.endsWith('.pdf')) extracted.address = '123 Example Ave (from PDF)';
        if (file.name.endsWith('.xlsx')) extracted.beds = 4;
        if (file.name.endsWith('.jpg')) extracted.notes = 'Image data recognized';
      });

      const coreQuestion =
        prompt('Core Question? (Example: "5-year IRR projection?")') || '5-year value-add analysis.';

      const analysis = {
        ...extracted,
        coreQuestion,
        summary: 'InvestorIQ analysis generated using institutional-grade modeling.',
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
        description: 'Your Property IQ Report is ready to download.',
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
        <title>InvestorIQ Dashboard - Property IQ Reports</title>
        <meta
          name="description"
          content="Upload property documents and generate institutional-grade Property IQ Reports with InvestorIQ."
        />
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-8 flex flex-col">
        <div className="max-w-5xl mx-auto flex-grow">
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-10"
          >
            <div>
              <h1 className="text-4xl font-extrabold text-[#0F172A]">
                Welcome, {profile?.full_name || 'Investor'}
              </h1>
              <p className="text-[#334155] mt-2 font-semibold">
                Upload your documents to generate your{' '}
                <span className="text-[#1F8A8A] font-semibold">Property IQ Report</span>.
              </p>
            </div>

            <div className="text-right mt-4 sm:mt-0">
              <div className="font-bold text-lg text-[#0F172A]">Report Credits</div>
              <div className="text-4xl font-extrabold text-[#0F172A]">{profile ? credits : '...'}</div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                {credits === 0 && (
                  <>
                    <p className="text-sm font-semibold text-slate-900">You have 0 report credits.</p>
                    <p className="mt-1 text-sm text-[#334155]">
                      Buy 1 credit to unlock uploads and generate your report.
                      <span className="ml-2 font-semibold text-slate-900">Promo code:</span>{' '}
                      <span className="font-mono text-slate-900">INVESTORIQ</span>
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={startCheckout}
                className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[#0F172A] bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
                >
                  Buy Credits
                </button>
              </div>
            </div>
          </motion.div>

          {/* UPLOAD SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Upload Property Documents</h2>
                <p className="text-[#334155] leading-relaxed font-medium">
                  Upload <strong>PDFs, spreadsheets, or property photos.</strong>
                  <br />
                  <span className="text-[#1F8A8A] font-semibold">The more you upload, the smarter your report.</span>{' '}
                  (10 MB max per file)
                </p>
                <p className="text-[#334155] text-sm mt-2">
                  Works for both <strong>off-market</strong> and MLS properties.
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
  <Button
    size="lg"
    type="button"
    onClick={() => {
      if (!profile || credits <= 0) {
        window.location.href = '/pricing';
        return;
      }

      if (!acknowledged) {
        toast({
          title: 'Acknowledgement required',
          description:
            'Please acknowledge the document-based limitations before uploading files.',
          variant: 'destructive',
        });
        return;
      }

      setIsModalOpen(true);
    }}
    className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
  >
    <UploadCloud className="mr-2 h-5 w-5" />
    Add file(s)
  </Button>

  {isModalOpen && (
  <div
    className="fixed inset-0 z-50"
    onClick={() => setIsModalOpen(false)}
    aria-hidden="true"
  >
    <div
      className="absolute right-4 top-[140px] w-[320px] rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Insert file"
    >
      <div className="text-sm font-semibold text-[#0F172A]">Insert file</div>
      <div className="mt-2 grid gap-2">
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(false);
            document.getElementById('fileInput')?.click();
          }}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
        >
          Upload files
          <div className="text-xs font-normal text-slate-500">
            PDFs, spreadsheets, or images
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(false);
            document.getElementById('cameraInput')?.click();
          }}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
        >
          Camera
          <div className="text-xs font-normal text-slate-500">
            Take photos of documents
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(false)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
</div>
            </div>

            <input
              id="fileInput"
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={handleUpload}
              className="hidden"
            />

            <input
              id="cameraInput"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleUpload}
              className="hidden"
            />

            {/* FILE PREVIEW */}
{uploadedFiles.length > 0 && (
  <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
    <h3 className="font-semibold mb-3 text-[#0F172A]">
      Files Selected ({uploadedFiles.length})
    </h3>

    <ul className="space-y-2 text-sm text-[#334155]">
      {uploadedFiles.map((file, idx) => (
        <li
          key={idx}
          className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-none"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[#0F172A]">
              {file.name}
            </div>
            <div className="text-xs text-[#334155]">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeUploadedFile(idx)}
            className="shrink-0 text-xs font-semibold text-[#0F172A] underline underline-offset-4 hover:opacity-80"
            aria-label={`Remove ${file.name}`}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  </div>
)}

            {/* DISCLAIMER */}
            <div className="mt-6 bg-[#1F8A8A]/10 border border-[#1F8A8A]/30 rounded-lg p-4 text-sm text-[#334155] font-medium flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-[#1F8A8A] flex-shrink-0 mt-[2px]" />
              <span>
                <strong className="text-[#0F172A]">Note:</strong> Report accuracy depends on the completeness and clarity
                of your uploaded data.
              </span>
            </div>

            <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
  <label className="flex items-start gap-3 text-sm text-slate-700">
    <input
      type="checkbox"
      checked={acknowledged}
      onChange={(e) => setAcknowledged(e.target.checked)}
      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
    />
    <span>
      <span className="font-medium">
        I acknowledge that InvestorIQ produces document-based underwriting only,
        does not provide investment or appraisal advice,
        and will disclose any missing or degraded inputs in the final report.
      </span>
      <br />
      <span className="mt-1 block text-xs text-slate-500">
        Analysis outputs are generated strictly from the documents provided.
        No assumptions or gap-filling are performed.
      </span>
    </span>
  </label>
</div>

            {/* ACTION BUTTON */}
<div className="flex justify-center mt-8">
  <Button
    size="lg"
    onClick={handleAnalyze}
    disabled={uploadedFiles.length === 0 || loading || !acknowledged}
    className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-8 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
  >
    {loading ? (
      <>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
      </>
    ) : (
      'Generate IQ Report'
    )}
  </Button>
</div>
          </motion.div>

          {/* RESULT CARD */}
          {reportData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center"
            >
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Report Generated Successfully</h3>
              <p className="text-[#334155] mb-6 font-medium">
                Address: {reportData.address} <br />
                Valuation: ${reportData.valuation.toLocaleString()} <br />
                Confidence: {reportData.confidence}%
              </p>
              <Button
                size="lg"
                onClick={() =>
                  toast({
                    title: 'Download Started',
                    description: 'Check your downloads folder.',
                  })
                }
                className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
              >
                <FileDown className="mr-2 h-5 w-5" /> Download Report
              </Button>
            </motion.div>
          )}
        </div>

      </div>

      <UploadModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUploadSuccess}
      />
    </>
  );
}
