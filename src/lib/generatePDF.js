/**
 * InvestorIQ PDF Generator (Elite Stable Version)
 * ----------------------------------------------
 * Completely removes document.write() to prevent blank PDF tabs.
 * Uses DOM injection and guarantees Chrome, Safari, Firefox stability.
 */

import { buildSampleReportDocDefinition } from "../lib/pdfSections";

// Lazy-load pdfMake + fonts
async function getPdfMake() {
  const pdfMakeModule = await import("pdfmake/build/pdfmake.js");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");

  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;

  pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs || {};
  return pdfMake;
}

// Convert /public image to base64
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
    console.warn("[InvestorIQ] Logo load failed:", err);
    return null;
  }
}

export const generatePDF = async (reportData = {}, options = {}) => {
  const { preview = false, fileName } = options;
  const pdfMake = await getPdfMake();

  const logoBase64 = await loadImageBase64(
    `${window.location.origin}/assets/logo.png`
  );

  const docDefinition = buildSampleReportDocDefinition({
    ...reportData,
    logoBase64,
  });

  console.log("[InvestorIQ] docDefinition ready");

  try {
    const pdf = pdfMake.createPdf(docDefinition);

    if (preview) {
      // SAFE new tab
      const tab = window.open("", "_blank");

      if (!tab) {
        alert("Popup blocked. Please allow popups for InvestorIQ.");
        return;
      }

      // Minimal HTML shell
      tab.document.body.style.margin = "0";
      tab.document.body.style.background = "#f9fafb";

      // Create iframe container
      const iframe = tab.document.createElement("iframe");
      iframe.style.border = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      tab.document.body.appendChild(iframe);

      // Insert PDF blob into iframe
      pdf.getBlob((blob) => {
        const url = URL.createObjectURL(blob);
        iframe.src = url;
      });
    } else {
      const safeName =
        fileName ||
        `InvestorIQ_Report_${reportData.property?.address || "Sample"}.pdf`;
      pdf.download(safeName);
    }
  } catch (err) {
    console.error("[InvestorIQ] PDF generation failed:", err);
    alert("Something went wrong generating your report.");
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
