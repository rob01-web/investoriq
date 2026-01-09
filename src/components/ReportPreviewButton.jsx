import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import PDFPreviewModal from "@/components/modals/PDFPreviewModal";
import { generatePDFBlob } from "@/lib/generatePDF";
import { motion, AnimatePresence } from "framer-motion";

/**
 * InvestorIQ ReportPreviewButton
 * ------------------------------------------------------------
 * Generates a Property IQ Report preview via pdfMake
 * and displays it in a branded InvestorIQ modal.
 * ------------------------------------------------------------
 */
const ReportPreviewButton = ({ reportData }) => {
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

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
      <div className="relative inline-block">
        <Button
          onClick={handlePreview}
          disabled={loading}
          aria-label="Preview InvestorIQ report"
          className="inline-flex items-center rounded-md border border-[#0F172A] bg-[#0F172A] text-white text-sm font-semibold px-5 py-3 hover:bg-[#0d1326]"
        >
          {loading ? "Generating..." : "Preview Report"}
        </Button>

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-8 h-8 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin mb-2"
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              />
              <p className="text-sm text-[#0F172A] font-semibold tracking-wide">
                Reviewing with the document-based underwriting framework...
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
