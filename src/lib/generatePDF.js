/**
 * InvestorIQ PDF Generator (CDN Loader Version)
 * --------------------------------------------
 * - Dynamically loads pdfMake + vfs_fonts from CDN at runtime
 * - Avoids all ESM/CJS/Vite/Vercel build issues
 * - Uses window.pdfMake once loaded
 */

import { buildSampleReportDocDefinition } from "../lib/pdfSections";

const PDFMAKE_CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7";

/**
 * Dynamically load pdfMake + fonts from CDN and return window.pdfMake.
 * Uses a cached promise so we only load once.
 */
function loadPdfMakeFromCdn() {
  if (typeof window === "undefined") {
    throw new Error("PDF generation is only available in the browser.");
  }

  // Already loaded
  if (window.pdfMake && window.pdfMake.createPdf) {
    return Promise.resolve(window.pdfMake);
  }

  // In-flight load
  if (window.__investorIQPdfMakePromise) {
    return window.__investorIQPdfMakePromise;
  }

  window.__investorIQPdfMakePromise = new Promise((resolve, reject) => {
    // 1) Load pdfmake.min.js
    const coreScript = document.createElement("script");
    coreScript.src = `${PDFMAKE_CDN_BASE}/pdfmake.min.js`;
    coreScript.async = true;

    coreScript.onload = () => {
      // 2) Load vfs_fonts.js after core is ready
      const fontsScript = document.createElement("script");
      fontsScript.src = `${PDFMAKE_CDN_BASE}/vfs_fonts.js`;
      fontsScript.async = true;

      fontsScript.onload = () => {
        if (window.pdfMake && window.pdfMake.createPdf) {
          resolve(window.pdfMake);
        } else {
          reject(new Error("pdfMake loaded but global pdfMake is missing."));
        }
      };

      fontsScript.onerror = () =>
        reject(new Error("Failed to load pdfMake fonts from CDN."));

      document.head.appendChild(fontsScript);
    };

    coreScript.onerror = () =>
      reject(new Error("Failed to load pdfMake core from CDN."));

    document.head.appendChild(coreScript);
  });

  return window.__investorIQPdfMakePromise;
}

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

  let pdfMake;
  try {
    pdfMake = await loadPdfMakeFromCdn();
  } catch (err) {
    console.error("[InvestorIQ] Failed to load pdfMake:", err);
    alert("PDF engine failed to load. Please check your connection and try again.");
    return;
  }

  const logoBase64 = await loadImageBase64(
    `${window.location.origin}/brand/investoriq-wordmark.svg`
  );

  const docDefinition = buildSampleReportDocDefinition({
    ...reportData,
    logoBase64,
  });

  console.log("[InvestorIQ] PDF docDefinition ready.");

  try {
    const pdf = pdfMake.createPdf(docDefinition);

    if (preview) {
      const tab = window.open("", "_blank");

      if (!tab) {
        alert("Popup blocked. Please enable popups for InvestorIQ.");
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
      const safeName =
        fileName ||
        `InvestorIQ_Report_${reportData?.property?.address || "Sample"}.pdf`;

      pdf.download(safeName);
    }
  } catch (err) {
    console.error("[InvestorIQ] PDF generation failed:", err);
    alert("There was an error generating your PDF. Check console for details.");
  }
};

export const generatePDFBlob = async (reportData = {}) => {
  let pdfMake;
  try {
    pdfMake = await loadPdfMakeFromCdn();
  } catch (err) {
    console.error("[InvestorIQ] Failed to load pdfMake for blob:", err);
    throw err;
  }

  return new Promise(async (resolve, reject) => {
    try {
      const logoBase64 = await loadImageBase64(
        `${window.location.origin}/brand/investoriq-wordmark.svg`
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
