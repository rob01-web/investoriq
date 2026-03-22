import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { motion } from "framer-motion";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  green:    '#0F2318',
  gold:     '#C9A84C',
  ink:      '#0C0C0C',
  ink3:     '#606060',
  ink4:     '#9A9A9A',
  white:    '#FFFFFF',
  warm:     '#FAFAF8',
  hairline: '#E8E5DF',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
`;

/**
 * InvestorIQ PDF Preview Modal
 * src/components/modals/PDFPreviewModal.jsx
 * ------------------------------------------------------------
 * Displays an embedded PDF viewer inside a branded modal overlay.
 * Used for viewing generated InvestorIQ Reports before download.
 * All props preserved exactly.
 * ------------------------------------------------------------
 */
const PDFPreviewModal = ({
  open,
  onClose,
  pdfBlobUrl,
  title = "InvestorIQ — Property IQ Report",
}) => {
  return (
    <>
      <style>{FONTS}</style>

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          style={{
            maxWidth:   '90vw',
            width:      '1100px',
            padding:    0,
            overflow:   'hidden',
            border:     `1px solid ${T.hairline}`,
            borderRadius: 0,
            boxShadow:  '0 24px 64px rgba(15,35,24,0.18)',
            background: T.white,
          }}
          aria-label="InvestorIQ PDF preview dialog"
        >
          {/* Modal header — Forest Green band */}
          <DialogHeader style={{
            display:        'flex',
            flexDirection:  'row',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '14px 24px',
            background:     T.green,
            borderBottom:   `1px solid rgba(201,168,76,0.12)`,
          }}>
            <DialogTitle style={{
              fontFamily:   "'DM Mono', monospace",
              fontSize:     10,
              letterSpacing:'0.18em',
              textTransform:'uppercase',
              color:        T.gold,
              fontWeight:   500,
              margin:       0,
            }}>
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              aria-label="Close preview"
              style={{
                background:  'transparent',
                border:      'none',
                cursor:      'pointer',
                color:       'rgba(255,255,255,0.5)',
                display:     'flex',
                alignItems:  'center',
                padding:     4,
                transition:  'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </DialogHeader>

          {/* PDF viewer */}
          {pdfBlobUrl ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', height: '80vh', background: T.warm }}
            >
              <iframe
                src={pdfBlobUrl}
                title="InvestorIQ Report Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
                loading="lazy"
              />
            </motion.div>
          ) : (
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        '64px 24px',
              background:     T.warm,
            }}>
              <p style={{
                fontFamily:   "'DM Mono', monospace",
                fontSize:     10,
                letterSpacing:'0.14em',
                textTransform:'uppercase',
                color:        T.ink4,
              }}>
                Generating preview…
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFPreviewModal;
