import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { buildSampleReportDocDefinition } from "../lib/pdfSections";

pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs || {};

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

/**
 * InvestorIQ PDF Generator (Launch-Ready Version)
 * ----------------------------------------------
 * Uses pre-opened tab + blob URL to ensure no blank screen.
 */
export const generatePDF = async (reportData = {}, options = {}) => {
  const { preview = false, fileName } = options;

  // ✅ Load logo (works both locally & deployed)
  const logoBase64 = await loadImageBase64(`${window.location.origin}/assets/logo.png`);

  // ✅ Build document definition
  const docDefinition = buildSampleReportDocDefinition({
    ...reportData,
    logoBase64,
  });

  // Debug: ensure it’s not empty
  console.log("[InvestorIQ] docDefinition:", docDefinition);
  console.log("[InvestorIQ] content length:", docDefinition?.content?.length || 0);

  try {
    const pdf = pdfMake.createPdf(docDefinition);

    if (preview) {
      // ✅ Pre-open tab so Chrome doesn't block it
      const newTab = window.open("about:blank", "_blank");

      pdf.getBlob((blob) => {
  if (!blob) {
    newTab.document.write(
      "<h3 style='font-family:sans-serif;padding:40px;color:#444'>Failed to generate PDF. Please try again.</h3>"
    );
    return;
  }

  const blobUrl = URL.createObjectURL(blob);

  // ✅ Embed PDF inside the tab so it always renders
  newTab.document.write(`
    <html>
      <head><title>InvestorIQ Sample Report</title></head>
      <body style="margin:0;padding:0;overflow:hidden;background:#f9fafb;">
        <iframe
          src="${blobUrl}"
          width="100%"
          height="100%"
          style="border:0;position:fixed;top:0;left:0;"
        ></iframe>
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
    alert("Something went wrong generating your report. Check the console for details.");
  }
};

// Generate blob for in-app modal previews
export const generatePDFBlob = async (reportData = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const logoBase64 = await loadImageBase64(`${window.location.origin}/assets/logo.png`);
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
