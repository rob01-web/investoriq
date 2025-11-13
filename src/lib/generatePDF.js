/**
 * InvestorIQ PDF Generator (Vercel-Safe Version)
 * ----------------------------------------------
 * Uses dynamic import for pdfMake + vfs_fonts to avoid Rollup build errors.
 */

import { buildSampleReportDocDefinition } from "../lib/pdfSections";

// Lazy-load pdfMake + fonts for build compatibility
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

// Main generator
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

  console.log("[InvestorIQ] docDefinition:", docDefinition);

  try {
    const pdf = pdfMake.createPdf(docDefinition);

    if (preview) {
      const newTab = window.open("about:blank", "_blank");
      pdf.getBlob((blob) => {
        if (!blob) {
          newTab.document.write(
            "<h3 style='font-family:sans-serif;padding:40px;color:#444'>Failed to generate PDF. Please try again.</h3>"
          );
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        newTab.document.write(`
          <html>
            <head>
              <title>InvestorIQ Sample Report</title>
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  background: #f9fafb;
                }
                iframe {
                  border: 0;
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                }
              </style>
            </head>
            <body>
              <iframe src="${blobUrl}"></iframe>
            </body>
          </html>
        `);
        newTab.document.close();
      });
    } else {
      const safeName =
        fileName ||
        `InvestorIQ_Report_${reportData.property?.address || "Sample"}.pdf`;
      pdf.download(safeName);
    }
  } catch (error) {
    console.error("[InvestorIQ] PDF generation failed:", error);
    alert("Something went wrong generating your report. Check the console.");
  }
};

// Blob version for in-app preview
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
