/**
 * InvestorIQ PDF Generator (Global pdfMake Version)
 * -------------------------------------------------
 * This version uses window.pdfMake loaded globally from index.html.
 * 100% compatible with Vite + Vercel + all browsers.
 */

import { buildSampleReportDocDefinition } from "../lib/pdfSections";

// Convert /public image to Base64
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
    console.warn("[InvestorIQ] Logo failed to load:", err);
    return null;
  }
}

export const generatePDF = async (reportData = {}, options = {}) => {
  const { preview = false, fileName } = options;

  // Ensure global pdfMake exists
  if (!window.pdfMake) {
    alert("PDF engine failed to load. Please refresh the page.");
    return;
  }

  const logoBase64 = await loadImageBase64(
    `${window.location.origin}/assets/logo.png`
  );

  const docDefinition = buildSampleReportDocDefinition({
    ...reportData,
    logoBase64,
  });

  console.log("[InvestorIQ] PDF definition ready.");
  
  try {
    const pdf = window.pdfMake.createPdf(docDefinition);

    if (preview) {
      const tab = window.open("", "_blank");

      if (!tab) {
        alert("Popup blocked. Enable popups for InvestorIQ.");
        return;
      }

      tab.document.body.style.margin = "0";
      tab.document.body.style.background = "#f9fafb";

      const iframe = tab.document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      tab.document.body.appendChild(iframe);

      pdf.getBlob((blob) => {
        if (!blob) {
          tab.document.body.innerHTML =
            "<h2 style='padding:40px;font-family:sans-serif;color:#444'>Failed to generate PDF.</h2>";
          return;
        }

        iframe.src = URL.createObjectURL(blob);
      });

    } else {
      const safeName = fileName || "InvestorIQ_Report.pdf";
      pdf.download(safeName);
    }
  } catch (err) {
    console.error("[InvestorIQ] PDF generation failed:", err);
    alert("PDF generation error. Check console.");
  }
};

export const generatePDFBlob = async (reportData = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const logoBase64 = await loadImageBase64(
        `${window.location.origin}/assets/logo.png`
      );

      const docDefinition = buildSampleReportDocDefinition({
        ...reportData,
        logoBase64,
      });

      const pdf = window.pdfMake.createPdf(docDefinition);

      pdf.getBlob((blob) => resolve(URL.createObjectURL(blob)));

    } catch (err) {
      reject(err);
    }
  });
};
