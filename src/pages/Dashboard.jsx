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
  const [propertyName, setPropertyName] = useState('');
  const [jobId, setJobId] = useState(null);
  const [inProgressJobs, setInProgressJobs] = useState([]);
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

  const fetchInProgressJobs = async () => {
  if (!profile?.id) return;

  const { data, error } = await supabase
    .from('analysis_jobs')
    .select('id, property_name, status, created_at')
    .eq('user_id', profile.id)
    .in('status', [
      'queued',
      'validating_inputs',
      'extracting',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
    ])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Failed to fetch in-progress jobs:', error);
    return;
  }

  setInProgressJobs(data || []);
};

  useEffect(() => {
  const syncEverything = async () => {
    await fetchProfile(profile.id);
    await fetchReports();
    await fetchInProgressJobs();

    // Reuse the most recent queued or in-progress job (supports walk-away / return later)
    if (!jobId) {
      const { data: existingJob, error } = await supabase
        .from('analysis_jobs')
        .select('id, status, created_at')
        .eq('user_id', profile.id)
        .in('status', ['queued', 'validating_inputs'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && existingJob?.id) {
        setJobId(existingJob.id);
      }
    }
  };

  if (profile?.id) {
    syncEverything();
      
      // ELITE PERFORMANCE: Automatically check for newly purchased credits every 2 seconds
      // This ensures if they just came from checkout, the credit appears without a refresh.
      const fastInterval = setInterval(() => fetchProfile(profile.id), 2000);
      const timeout = setTimeout(() => clearInterval(fastInterval), 10000);

      return () => {
        clearInterval(fastInterval);
        clearTimeout(timeout);
      };
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
    if (!profile?.id) return;

    // Create a job the moment the user begins uploading (async underwriting anchor)
    if (!jobId) {
      const { data, error } = await supabase
        .from('analysis_jobs')
        .insert({
          user_id: profile.id,
          property_name: propertyName.trim() || 'Untitled Property',
          status: 'queued',
          prompt_version: 'v2026-01-17',
          parser_version: 'v1',
          template_version: 'v2026-01-14',
          scoring_version: 'v1',
        })
        .select('id')
        .single();

      if (error || !data?.id) {
        console.error('Failed to create analysis job:', error);
        toast({
          title: 'Unable to start analysis job',
          description: 'We could not initialize your underwriting run. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setJobId(data.id);
    }

    toast({
      title: 'Upload Successful',
      description: 'Your documents have been received and queued for processing.',
    });

    await fetchProfile(profile.id);
  };

    const handleUpload = async (e) => {
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

    // Use a local job id to avoid React state timing issues
let effectiveJobId = jobId;

// Create a job the moment the user begins uploading (async underwriting anchor)
if (profile?.id && !effectiveJobId) {
  const { data, error } = await supabase
    .from('analysis_jobs')
    .insert({
      user_id: profile.id,
      property_name: propertyName.trim() || 'Untitled Property',
      status: 'queued',
      prompt_version: 'v2026-01-17',
      parser_version: 'v1',
      template_version: 'v2026-01-14',
      scoring_version: 'v1',
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    console.error('Failed to create analysis job:', error);
    toast({
      title: 'Unable to start analysis job',
      description: 'We could not initialize your underwriting run. Please try again.',
      variant: 'destructive',
    });
    return;
  }

  effectiveJobId = data.id;
  setJobId(effectiveJobId);
}

// Upload files to Supabase Storage under this underwriting job
if (!profile?.id || !effectiveJobId) {
  toast({
    title: 'Upload blocked',
    description: 'Unable to initialize your underwriting run. Please try again.',
    variant: 'destructive',
  });
  return;
}

const bucket = 'staged_uploads';

for (const file of files) {
  // Prevent path injection
  const safeName = String(file.name || 'file').replaceAll('/', '_');
  const objectPath = `staged/${profile.id}/${effectiveJobId}/${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr) {
      console.error('Staged upload failed:', uploadErr);
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${safeName}. Please try again.`,
        variant: 'destructive',
      });
      return;
    }

        const { error: rowErr } = await supabase
      .from('analysis_job_files')
      .insert({
        job_id: effectiveJobId,
        user_id: profile.id,
        bucket,
        object_path: objectPath,
        original_filename: safeName,
        mime_type: file.type || 'application/octet-stream',
        bytes: file.size,
      });

    if (rowErr) {
      console.error('analysis_job_files insert failed:', rowErr);
      toast({
        title: 'Upload recorded incompletely',
        description: `File uploaded but could not be linked to your job: ${safeName}.`,
        variant: 'destructive',
      });
      return;
    }
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
    if (!propertyName.trim()) {
      toast({
        title: 'Property name required',
        description: 'Enter a property name before generating your report.',
        variant: 'destructive',
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: 'Document Required',
        description: 'Please upload your OM or Rent Roll to begin institutional underwriting.',
        variant: 'destructive',
      });
      return;
    }

    // ELITE UX: Trigger the "Working" state immediately
    setLoading(true); 
    
    // Background handshake: Force a refresh to find the latest data
    await fetchProfile(profile.id); // Update the credit count on screen
    
    // MATCHING SUPABASE: Look specifically for report_credits
    const verifiedCredits = Number(profile?.report_credits ?? 0);

    if (verifiedCredits < 1) {
      setLoading(false);
      toast({
        title: "Insufficient Credits",
        description: "Your balance is 0. Please ensure your purchase has processed.",
        variant: "destructive",
      });
      return;
    }

    // 3. Start Loading Overlay
    setLoading(true);

    try {
  if (!jobId) {
    toast({
      title: 'Analysis not initialized',
      description: 'Please upload at least one document before generating.',
      variant: 'destructive',
    });
    return;
  }

  const { error: statusErr } = await supabase
    .from('analysis_jobs')
    .update({
      status: 'validating_inputs',
      started_at: new Date().toISOString(),
      property_name: propertyName.trim() || 'Untitled Property',
    })
    .eq('id', jobId)
    .eq('user_id', profile.id);

  if (statusErr) {
    console.error('Failed to advance job status:', statusErr);
    toast({
      title: 'Unable to start analysis',
      description: 'Please try again.',
      variant: 'destructive',
    });
    return;
  }

  toast({
    title: 'Report queued',
    description: 'Your underwriting run has started. You may safely close this page and return later.',
  });

  await fetchInProgressJobs();
  await fetchReports();
} catch (error) {
  console.error('Queue Error FULL:', error, error?.stack);
  toast({
    title: 'Unable to queue report',
    description: error.message || 'An error occurred while starting the underwriting run.',
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
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Property Details</h2>

<div className="mb-4">
  <label className="block text-sm font-semibold text-[#0F172A] mb-1">
    Property Name
  </label>
  <input
    type="text"
    value={propertyName}
    onChange={(e) => setPropertyName(e.target.value)}
    placeholder="e.g. 123 Main Street Apartments"
    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F8A8A]/30"
  />
</div>

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

            {/* STAGED DOCUMENTS */}
            {uploadedFiles.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] mb-4">
                  Staged Documents ({uploadedFiles.length})
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[#0F172A] truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-[10px] font-bold text-red-700 hover:text-red-900 uppercase tracking-widest ml-4 shrink-0"
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
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                Report Generated Successfully
              </h3>
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

          {/* IN-PROGRESS ANALYSIS JOBS */}
{inProgressJobs.length > 0 && (
  <div className="mt-12">
    <h2 className="text-xl font-bold text-[#0F172A] mb-6">
      In Progress
    </h2>

    <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm divide-y">
      {inProgressJobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center justify-between px-6 py-4"
        >
          <div>
            <div className="text-sm font-semibold text-[#0F172A]">
              {job.property_name || 'Untitled Property'}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
              Status: {job.status.replaceAll('_', ' ')}
            </div>
          </div>

          <div className="text-sm font-semibold text-[#1F8A8A]">
            Processing
          </div>
        </div>
      ))}
    </div>
  </div>
)}

          {/* RECENT REPORTS TABLE */}
          <div className="mt-12 mb-20">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">
              Recent Property IQ Reports
            </h2>
            <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-[#0F172A] uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-[#0F172A] uppercase tracking-wider"
                    >
                      Property Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-[#0F172A] uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {reportsLoading ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-sm text-slate-500"
                      >
                        Retrieving report records...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-sm text-slate-500"
                      >
                        No reports found in your vault.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0F172A]">
                          {report.property_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              const { data } = await supabase.storage
                                .from('generated_reports')
                                .createSignedUrl(report.storage_path, 3600);
                              if (data?.signedUrl)
                                window.open(data.signedUrl, '_blank');
                            }}
                            className="text-[#1F8A8A] hover:text-[#0F172A] font-bold mr-4"
                          >
                            Download
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  'Are you sure you want to permanently remove this report?'
                                )
                              ) {
                                try {
                                  await supabase.storage
                                    .from('generated_reports')
                                    .remove([report.storage_path]);
                                  await supabase
                                    .from('reports')
                                    .delete()
                                    .eq('id', report.id);
                                  toast({ title: 'Report Deleted' });
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
            <p className="text-slate-600 text-sm leading-relaxed text-center">
              InvestorIQ is analyzing your documents and generating your institutional-grade Property IQ Report.
            </p>
            <div className="mt-6 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-[#1F8A8A] h-full animate-progress" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
