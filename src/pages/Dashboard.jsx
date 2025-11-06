'use client';

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import UploadModal from '@/components/UploadModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { toast } = useToast();
  const { profile, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [reportData, setReportData] = useState(null);

  const handleUploadSuccess = async () => {
    toast({
      title: "Upload Successful!",
      description: "Your deal is now being analyzed. You'll be notified upon completion.",
    });
    if (profile?.id) {
      await fetchProfile(profile.id);
    }
  };

  const handleGenerate = () => {
    if (!address) return alert("Enter an address!");

    const mockReport = {
      address,
      bedrooms: Number(bedrooms) || 3,
      bathrooms: Number(bathrooms) || 2,
      summary: `Stunning ${bedrooms}-bed, ${bathrooms}-bath property in prime location. High demand area with excellent schools and transit.`,
      valuation: 1250000,
      confidence: 94,
      trend: 'Rising 8.2% YoY',
      comps: '3 comparable sales within 0.5 miles: $1.18M, $1.26M, $1.31M'
    };

    setReportData(mockReport);
  };

  const handleUpload = (e) => {
    setUploadedFiles(Array.from(e.target.files));
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return alert('Upload docs first!');
    setLoading(true);
    try {
      let extracted = {};
      uploadedFiles.forEach(file => {
        if (file.name.endsWith('.pdf')) extracted.address = '123 Elite St (from PDF)';
        if (file.name.endsWith('.xlsx')) extracted.beds = 4;
        if (file.name.endsWith('.jpg')) extracted.notes = 'Scanned pic: High-end kitchen (OCR)';
      });
      console.log('Extracted Key-Values:', extracted);

      const coreQuestion = prompt('Core Question? (e.g., "5-year IRR?")') || '5-year value-add analysis.';
      const deepSkyPrompt = `**ROLE & GOAL:** You are an expert institutional real estate investment analyst. Your task is to generate a comprehensive, "Golden ELITE" investment analysis report for the property data provided below. The final report must be formatted as a single, clean HTML file with embedded CSS and JavaScript for charts. It must be suitable for high-fidelity PDF conversion via an API like DocRaptor. **TONE & STYLE:** - **Tone:** Professional, confident, authoritative, and data-driven. - **Formatting:** Use headings (h1, h2, h3), bullet points, bolding for key metrics and verdicts, and clean tables for financial data. - **Consistency:** Strictly adhere to the section order and content requirements outlined below to ensure every report is uniform. - **Visuals:** All charts must be rendered using Google Charts. For conceptual images, provide a placeholder text like "[Conceptual Image: Description]". **CLIENT & PROPERTY DATA:** ${JSON.stringify(extracted, null, 2)} **CORE ANALYTICAL REQUEST:** ${coreQuestion}`;

      const analysis = { ...extracted, summary: 'Elite off-market analysis from DeepSky prompt.', valuation: 5000000 };
      const { generatePDF } = await import('@/lib/docGenerator');
      await generatePDF(analysis);
      alert('DEEPSKY ELITE REPORT READY!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - InvestorIQ</title>
        <meta name="description" content="Manage your deals and generate AI-powered real estate reports." />
      </Helmet>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome, {profile?.full_name || 'Investor'}!
              </h1>
              <p className="text-slate-600 mt-1">Ready to find your next winning deal?</p>
            </div>
            <div className="text-right">
                <div className="font-bold text-lg text-slate-700">Report Credits</div>
                <div className="text-3xl font-extrabold text-blue-600">{profile?.report_credits ?? '...'}</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-2xl p-6 md:p-8"
          >
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Analyze a New Deal</h2>
                  <p className="text-slate-600 mt-1">
                    {profile?.report_credits > 0 
                      ? "You're ready to analyze. Let's find some hidden gems!"
                      : "You're out of credits. Purchase more to continue."}
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => setIsModalOpen(true)} 
                  disabled={!profile || profile.report_credits <= 0}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:scale-105 transition-transform"
                >
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Upload Deal
                </Button>
            </div>
          </motion.div>

          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Generate Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Property Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Bedrooms"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Bathrooms"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Upload Off-Market Deal (Paid Only)</h2>
            <input 
              type="file" 
              multiple 
              accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png" 
              onChange={handleUpload} 
              className="w-full px-4 py-2 border rounded-lg mb-4" 
            />
            <button 
              onClick={handleAnalyze} 
              disabled={uploadedFiles.length === 0 || loading}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition"
            >
              {loading ? 'Analyzing...' : 'Generate Elite Report'}
            </button>
          </div>

          {reportData && (
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-green-700 mb-4">Report Ready!</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
                <p><strong>Address:</strong> {reportData.address}</p>
                <p><strong>Value:</strong> ${reportData.valuation.toLocaleString()}</p>
                <p><strong>Confidence:</strong> {reportData.confidence}%</p>
              </div>

              <button
                onClick={async () => {
                  if (!reportData) return;
                  setLoading(true);
                  try {
                    const { generatePDF } = await import('@/lib/docGenerator');
                    await generatePDF(reportData);
                    toast({
                      title: "Report Downloaded!",
                      description: "Elite analysis complete.",
                    });
                  } catch (err) {
                    console.error('PDF ERROR:', err);
                    toast({
                      title: "Upload Error",
                      description: "Check console for details.",
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={`w-full px-6 py-4 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-105 ${
                  loading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-xl'
                }`}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : <FileDown className="mr-2 h-5 w-5 inline" />}
                {loading ? 'Generating Elite PDF...' : 'Download Report'}
              </button>
            </div>
          )}

          <div className="mt-8">
             <h3 className="text-xl font-bold text-slate-800 mb-4">Analysis History</h3>
             <div className="bg-white rounded-xl shadow-lg p-8 text-center text-slate-500">
                <p>Your analyzed reports will appear here.</p>
                <p className="text-sm">Start by uploading a new deal to see the magic happen!</p>
             </div>
          </div>
          
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