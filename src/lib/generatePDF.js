// src/lib/generatePDF.js
// InvestorIQ Elite Property Report Generator (modular version)

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { buildAllSections, PALETTE } from "./pdfSections"; // ← hookup

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generatePDF = async (reportData = {}) => {
  const parsed = reportData.parsed || reportData.extracted_data || {};
  const logoUrl =
    "https://horizons-cdn.hostinger.com/75ea0594-14c3-4644-b473-69366dd2e129/7c549d98bf6c15c8f3d897bc03104499.png";

  // Build all standardized sections from pdfSections.js
  const sections = buildAllSections(parsed, { logoUrl });

  const docDefinition = {
    info: {
      title: "InvestorIQ Elite Property Report",
      author: "InvestorIQ AI Analyst Engine",
      subject: "Institutional-Grade Property Analysis",
    },
    pageSize: "A4",
    pageMargins: [40, 70, 40, 60],

    background: () => ({
      image: logoUrl,
      width: 300,
      opacity: 0.05,
      absolutePosition: { x: 130, y: 250 },
    }),

    header: {
      columns: [
        { image: logoUrl, width: 80, margin: [40, 20, 0, 0] },
        {
          text: "InvestorIQ  |  Elite Property Report",
          alignment: "right",
          margin: [0, 35, 40, 0],
          fontSize: 14,
          bold: true,
          color: PALETTE.deepNavy,
        },
      ],
    },

    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: "© 2025 InvestorIQ. All Rights Reserved.",
          alignment: "left",
          margin: [40, 0, 0, 0],
          fontSize: 9,
          color: PALETTE.midGray,
        },
        {
          text: `${currentPage} of ${pageCount}`,
          alignment: "right",
          margin: [0, 0, 40, 0],
          fontSize: 9,
          color: PALETTE.midGray,
        },
      ],
    }),

    // Replace the hard-coded 3-page layout with modular sections
    content: [
      ...sections,
    ],

    styles: {
      address: {
        fontSize: 22,
        bold: true,
        color: PALETTE.deepNavy,
        alignment: "center",
      },
      subheader: {
        fontSize: 11,
        color: PALETTE.midGray,
        alignment: "center",
        margin: [0, 0, 0, 20],
      },
      sectionHeader: {
        fontSize: 15,
        bold: true,
        color: PALETTE.teal,
      },
      bodyText: {
        fontSize: 11,
        color: "#374151",
        lineHeight: 1.5,
      },
      footerTag: {
        fontSize: 10,
        color: PALETTE.midGray,
        alignment: "center",
        italics: true,
      },
    },

    defaultStyle: { fontSize: 11, lineHeight: 1.4 },
  };

  try {
    const pdf = pdfMake.createPdf(docDefinition);
    pdf.download(`InvestorIQ_Report_${reportData.address || "Property"}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
  }
};
