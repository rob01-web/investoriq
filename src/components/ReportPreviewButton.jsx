import React, { useState } from "react";
import PDFPreviewModal from "@/components/modals/PDFPreviewModal";
import { generatePDFBlob } from "@/lib/generatePDF";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  ink:      '#0C0C0C',
  ink3:     '#606060',
  hairline: '#E8E5DF',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

/**
 * InvestorIQ ReportPreviewButton
 * src/components/ReportPreviewButton.jsx
 * ------------------------------------------------------------
 * Generates a Property IQ Report preview via pdfMake and
 * displays it in the branded PDFPreviewModal.
 * All logic preserved exactly.
 * ------------------------------------------------------------
 */
const ReportPreviewButton = ({ reportData }) => {
  const [open, setOpen]       = useState(false);
  const [pdfUrl, setPdfUrl]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [hov, setHov]         = useState(false);

  // All original logic unchanged
  const handlePreview = async () => {
    setLoading(true);
    try {
      const blobUrl = await generatePDFBlob(reportData);
      setPdfUrl(blobUrl);
      setOpen(true);
    } catch (err) {
      console.error("[InvestorIQ] Preview generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{FONTS}</style>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          aria-label="Preview InvestorIQ report"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           8,
            fontFamily:    "'DM Mono', monospace",
            fontSize:      10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight:    500,
            padding:       '11px 24px',
            background:    loading ? T.hairline : hov ? T.gold : T.green,
            color:         loading ? T.ink3 : hov ? T.green : T.gold,
            border:        `1px solid ${loading ? T.hairline : T.green}`,
            cursor:        loading ? 'not-allowed' : 'pointer',
            transition:    'all 0.15s',
          }}
        >
          {loading && (
            <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
          )}
          {loading ? 'Generating…' : 'Preview Report'}
        </button>

        {/* Loading overlay — original AnimatePresence logic preserved */}
        <AnimatePresence>
          {loading && (
            <motion.div
              style={{
                position:       'absolute',
                inset:          0,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                background:     'rgba(255,255,255,0.88)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                width:        28,
                height:       28,
                border:       `2px solid ${T.green}`,
                borderTopColor:'transparent',
                borderRadius: '50%',
                animation:    'spin 1s linear infinite',
                marginBottom: 8,
              }} />
              <p style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     9,
                letterSpacing:'0.12em',
                textTransform:'uppercase',
                color:        T.ink3,
              }}>
                Reviewing with the document-based underwriting framework…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PDFPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        pdfBlobUrl={pdfUrl}
      />
    </>
  );
};

export default ReportPreviewButton;
