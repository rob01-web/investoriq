import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion } from "framer-motion";

/**
 * InvestorIQ PDF Preview Modal
 * ------------------------------------------------------------
 * Displays an embedded PDF viewer inside a branded modal overlay.
 * Used for viewing generated InvestorIQ Reports before download.
 * ------------------------------------------------------------
 */

const PDFPreviewModal = ({
  open,
  onClose,
  pdfBlobUrl,
  title = "InvestorIQ Property IQ Report™",
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden border border-[#1F8A8A]/20 shadow-2xl rounded-2xl bg-white"
        aria-label="InvestorIQ PDF preview dialog"
      >
        <DialogHeader className="flex justify-between items-center px-6 pt-4 pb-2 bg-[#0F172A] text-white">
          <DialogTitle className="text-lg font-semibold tracking-wide">
            {title}
          </DialogTitle>
          <Button
            onClick={onClose}
            size="icon"
            variant="ghost"
            className="text-white hover:text-[#D4AF37]"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {pdfBlobUrl ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-[80vh] bg-[#F9FAFB]"
          >
            <iframe
              src={pdfBlobUrl}
              title="InvestorIQ Report Preview"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </motion.div>
        ) : (
          <div className="flex flex-col justify-center items-center py-16 text-slate-500 bg-[#F9FAFB]">
            <p className="text-sm tracking-wide">Generating preview...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
