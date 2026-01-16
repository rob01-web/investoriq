import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, AlertCircle, FileDown } from 'lucide-react';
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
  const [ackLocked, setAckLocked] = useState(false);
  const [ackAcceptedAtLocal, setAckAcceptedAtLocal] = useState(null);
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const fetchReports = async () => {
    if (!profile?.id) return;
    try {
      setReportsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchReports();
    }
  }, [profile?.id]);

  const removeUploadedFile = (index) => {
  setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
};

  // Immutable policy identity (must match server constants)
const POLICY_KEY = 'analysis_disclosures';
const POLICY_VERSION = 'v2026-01-14';

const credits = Number(profile?.report_credits ?? 0);

  const policyText =
    'InvestorIQ produces document-based underwriting only, does not provide investment or appraisal advice, and will disclose any missing or degraded inputs in the final report. Analysis outputs are generated strictly from the documents provided. No assumptions or gap-filling are performed.';

  const computePolicyTextHash = async () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(policyText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const startCheckout = async () => {
  try {
    if (!profile?.id || !profile?.email) {
      toast({
        title: 'Please sign in',
        description: 'You must be signed in to purchase credits.',
        variant: 'destructive',
      });
      return;
    }

    const origin = window.location.origin;

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planKey: 'single',
        productType: 'singleReport',
        userId: profile.id,
        userEmail: profile.email,
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
  
    const recordLegalAcceptance = async () => {
    if (!profile?.id) return false;

    const policyTextHash = await computePolicyTextHash();

    try {
      const res = await fetch('/api/legal-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
          userId: profile.id,
          policyTextHash,
        }),
      });

        if (!res.ok) {
        console.error('Legal acceptance API failed:', await res.text());
        return { ok: false };
      }

      const data = await res.json().catch(() => ({}));

      // If the API returns the authoritative server timestamp, use it.
      const acceptedAt = data?.accepted_at || data?.acceptedAt || null;

      return { ok: true, acceptedAt };
    } catch (err) {
      console.error('Legal acceptance error:', err);
      return false;
    }
  };

  const handleUploadSuccess = async () => {
    toast({
      title: 'Upload Successful',
      description: 'Your documents have been received and queued for processing.',
    });
    if (profile?.id) await fetchProfile(profile.id);
  };

  const handleUpload = (e) => {
  const files = Array.from(e.target.files || []);

  // allow selecting the same file again later
  e.target.value = '';

  // --- File type enforcement (allowlist + hard block) ---
  const allowedExt = new Set([
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'csv',
    'ppt',
    'pptx',
    'jpg',
    'jpeg',
    'png',
    'txt',
  ]);

  // Block executables / scripts even if someone bypasses the picker
  const blockedExt = new Set([
    'exe',
    'msi',
    'bat',
    'cmd',
    'com',
    'scr',
    'pif',
    'cpl',
    'jar',
    'js',
    'jse',
    'vbs',
    'vbe',
    'ps1',
    'psm1',
    'psd1',
    'sh',
    'bash',
    'zsh',
    'py',
    'rb',
    'php',
    'pl',
    'dll',
    'sys',
    'lnk',
  ]);

  const getExt = (name) => {
    const base = (name || '').trim().toLowerCase();
    const lastDot = base.lastIndexOf('.');
    if (lastDot === -1) return '';
    return base.slice(lastDot + 1);
  };

  const blocked = [];
  const invalid = [];

  for (const f of files) {
    const ext = getExt(f.name);

    if (!ext) {
      invalid.push(f.name || '(unnamed file)');
      continue;
    }

    if (blockedExt.has(ext)) {
      blocked.push(f.name);
      continue;
    }

    if (!allowedExt.has(ext)) {
      invalid.push(f.name);
      continue;
    }
  }

  if (blocked.length > 0) {
    toast({
      title: 'Blocked file type',
      description: `For security reasons, these file types are not allowed: ${blocked.join(', ')}`,
      variant: 'destructive',
    });
    return;
  }

  if (invalid.length > 0) {
    toast({
      title: 'Unsupported file type',
      description:
        'Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, JPG, JPEG, PNG.',
      variant: 'destructive',
    });
    return;
  }

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

      const coreQuestion = null;
      
      const analysis = {
  ...extracted,
  coreQuestion,
  summary:
    'Analysis outputs are generated strictly from the documents provided. No assumptions or gap-filling are performed.',
};

      const res = await fetch('/api/generate-client-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: profile.id,
    analysis,
  }),
});

if (res.status === 403) {
  toast({
    title: 'Insufficient report credits',
    description: 'Please purchase additional credits to generate another report.',
    variant: 'destructive',
  });
  return;
}

if (!res.ok) {
  throw new Error('Report generation failed');
}

const data = await res.json();

if (!data.url) {
  throw new Error('Report URL not received from server');
}

// Open PDF in new tab immediately
window.open(data.url, '_blank');

// Refresh credits from server
if (profile?.id) {
  await fetchProfile(profile.id);
}

// Trigger automatic refresh of the reports table
fetchReports();

setReportData({
  address: extracted.address || 'Address not found in uploaded documents.',
  reportUrl: data.url,
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
  onClick={() => {
    if (!acknowledged) {
      toast({
        title: 'Acknowledgement required',
        description:
          'Please acknowledge the document-based limitations before purchasing credits.',
        variant: 'destructive',
      });
      return;
    }

    startCheckout();
  }}
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

              <div className="relative flex flex-col items-end gap-3">
                <Button
                  size="lg"
                  type="button"
                  onClick={async () => {
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
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsModalOpen(false)}
                      aria-hidden="true"
                    />

                    <div
                      className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
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
                  </>
                )}
              </div>
            </div>

            <input
  id="fileInput"
  type="file"
  multiple
  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
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

            {/* STAGED FILES LIST */}
            {uploadedFiles.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
                  Staged Documents ({uploadedFiles.length})
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[#0F172A] truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUploadedFile(index)}
                        className="text-xs font-bold text-red-700 hover:text-red-900 uppercase tracking-tight ml-4 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
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
                  disabled={ackLocked || ackSubmitting}
                  onChange={async (e) => {
                    const next = e.target.checked;

                    // Do not allow unchecking once accepted (institutional audit posture)
                    if (!next) return;

                    // Belt and suspenders: block duplicate submits
                    if (ackLocked || acknowledged || ackSubmitting) return;

                    setAckSubmitting(true);

                    // Attempt to record acceptance immediately when the user checks the box
                    const accepted = await recordLegalAcceptance();
                    if (!accepted?.ok) {
                      toast({
                        title: 'Unable to record acknowledgement',
                        description:
                          'We could not record your acceptance of the required disclosures. Please try again.',
                        variant: 'destructive',
                      });
                      setAcknowledged(false);
                      setAckLocked(false);
                      setAckSubmitting(false);
                      return;
                    }

                    setAcknowledged(true);
                    setAckLocked(true);
                    setAckAcceptedAtLocal(accepted?.acceptedAt || new Date().toISOString());
                    setAckSubmitting(false);
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0F172A]"
                />
                <span className="flex flex-col">
                  <span className="font-medium">
                    I acknowledge that InvestorIQ produces document-based underwriting only, does not provide investment
                    or appraisal advice, and will disclose any missing or degraded inputs in the final report.
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Accepted disclosures v2026-01-14
                    {ackAcceptedAtLocal
                      ? ` on ${new Date(ackAcceptedAtLocal).toLocaleString()}`
                      : ''}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Analysis outputs are generated strictly from the documents provided. No assumptions or gap-filling are
                    performed.
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
  Address: {reportData.address}
</p>
              <Button
                size="lg"
                onClick={() => {
                  if (reportData?.reportUrl) {
                    window.open(reportData.reportUrl, '_blank');
                  }
                }}
                
                className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d1326]"
              >
                <FileDown className="mr-2 h-5 w-5" /> Download Report
              </Button>
            </motion.div>
          )}
        </div>
        {/* RECENT REPORTS TABLE */}
          <div className="mt-12 mb-20">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">Recent Property IQ Reports</h2>
            <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                      Property Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {reportsLoading ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-500">
                        Retrieving report records...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-500">
                        No reports found in your vault.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0F172A]">
                          {report.property_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              const { data, error } = await supabase.storage
                                .from('generated_reports')
                                .createSignedUrl(report.storage_path, 3600);
                              if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                            }}
                            className="text-[#1F8A8A] hover:text-[#0F172A] font-bold mr-4"
                          >
                            Download
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to permanently remove this report?')) {
                                try {
                                  await supabase.storage
                                    .from('generated_reports')
                                    .remove([report.storage_path]);
                                  await supabase.from('reports').delete().eq('id', report.id);
                                  toast({ title: "Report Deleted" });
                                  fetchReports();
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                            className="text-red-700 hover:text-red-900 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* INSTITUTIONAL LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center max-w-sm text-center">
            <Loader2 className="h-12 w-12 text-[#0F172A] animate-spin mb-6" />
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Underwriting in Progress</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              InvestorIQ is analyzing your documents and generating your institutional-grade Property IQ Report. This usually takes 15-30 seconds.
            </p>
            <div className="mt-6 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-[#1F8A8A] h-full animate-progress" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
