/**
 * InvestorIQ PDF Generator (Elite Stable Version)
 * ------------------------------------------------
 * - Fully fixes blank PDF tab issues
 * - Correct VFS (font) binding for pdfMake
 * - Safe iframe injection (no document.write)
 * - Works on Vercel + Vite + dynamic imports
 */

import { buildSampleReportDocDefinition } from "../lib/pdfSections";

// Load pdfMake + fonts correctly
async function getPdfMake() {
  // Load core
  const pdfMakeModule = await import("pdfmake/build/pdfmake.js");

  // Load fonts (vfs)
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");

  // Extract pdfMake
  const pdfMake = pdfMakeModule.default || pdfMakeModule;

  // VERY IMPORTANT:
  // vfs_fonts exports: { pdfMake: { vfs: { ... } } }
  pdfMake.vfs = pdfFontsModule.pdfMake.vfs;

  return pdfMake;
}

// Convert image file in /public to Base64
async function loadImageBase64(path) {
  try {
    const response = await fetch(path);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("[InvestorIQ] Failed to load logo:", err);
    return null;
  }
}

// Main PDF generator
export const generatePDF = async (reportData = {}, options = {}) => {
  const { preview = false, fileName } = options;

  const pdfMake = await getPdfMake();

  // Load our logo from public/assets
  const logoBase64 = await loadImageBase64(
    `${window.location.origin}/assets/logo.png`
  );

  // Build full docDefinition
  const docDefinition = buildSampleReportDocDefinition({
    ...reportData,
    logoBase64,
  });

  console.log("[InvestorIQ] PDF docDefinition:", docDefinition);

  try {
    const pdf = pdfMake.createPdf(docDefinition);

    if (preview) {
      // Open a clean tab (SAFE)
      const tab = window.open("", "_blank");

      if (!tab) {
        alert("Popup blocked. Allow popups for InvestorIQ to view reports.");
        return;
      }

      // Minimal frame
      tab.document.body.style.margin = "0";
      tab.document.body.style.background = "#f9fafb";

      // Create PDF iframe container
      const iframe = tab.document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      tab.document.body.appendChild(iframe);

      // Generate PDF blob → assign to iframe
      pdf.getBlob((blob) => {
        if (!blob) {
          iframe.remove();
          tab.document.body.innerHTML =
            "<h2 style='font-family:sans-serif;padding:40px;color:#444'>Failed to generate PDF.</h2>";
          return;
        }
        const url = URL.createObjectURL(blob);
        iframe.src = url;
      });
    } else {
      // Direct download
      const safeName =
        fileName ||
        `InvestorIQ_Report_${reportData.property?.address || "Sample"}.pdf`;

      pdf.download(safeName);
    }
  } catch (err) {
    console.error("[InvestorIQ] PDF generation error:", err);
    alert("PDF generation failed. Check console for details.");
  }
};

// Blob-only version
export const generatePDFBlob = async (reportData = {}) => {
  const pdfMake = await getPdfMake();

  return new Promise(async (resolve, reject) => {
    try {
      const logoBase64 = await loadImageBase64(
        `${window.location.origin}/assets/logo.png`
      );

      const docDefinition = buildSampleReportDocDefinition({
        ...reportData,
        logoBase64,
      });

      const pdf = pdfMake.createPdf(docDefinition);

      pdf.getBlob((blob) => resolve(URL.createObjectURL(blob)));
    } catch (err) {
      reject(err);
    }
  });
};
