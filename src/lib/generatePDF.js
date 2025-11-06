import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// CRITICAL FIX: This line is required for pdfmake to work in the browser.
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generatePDF = async (reportData) => {
  if (!reportData) {
    console.error("generatePDF was called with no data.");
    return;
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    header: {
      text: 'InvestorIQ — Elite Property Report',
      style: 'header',
      alignment: 'center',
      margin: [0, 30, 0, 0]
    },
    footer: function(currentPage, pageCount) {
      return {
        text: currentPage.toString() + ' of ' + pageCount,
        alignment: 'center',
        style: 'footer'
      };
    },
    content: [
      {
        canvas: [
          { type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#1a56db' }
        ],
        margin: [0, 10, 0, 20]
      },
      {
        text: reportData.property_address || reportData.address || 'N/A',
        style: 'address'
      },
      {
        text: `Report Date: ${new Date().toLocaleDateString()}`,
        style: 'subheader'
      },
      {
        text: 'Financial Snapshot',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Asking Price', `$${(reportData.extracted_data?.asking_price || 0).toLocaleString()}`],
            ['Pro-Forma NOI', `$${(reportData.extracted_data?.noi_proforma || 0).toLocaleString()}`],
            ['Pro-Forma Cap Rate', `${(reportData.extracted_data?.cap_rate || 0).toFixed(2)}%`],
            ['Projected IRR', `${(reportData.extracted_data?.irr || 0).toFixed(2)}%`]
          ]
        },
        layout: 'lightHorizontalLines'
      },
      {
        text: 'NOI Analysis (Current vs. Pro-Forma)',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        canvas: [
          // Background grid lines
          ...Array.from({ length: 5 }, (_, i) => ({ type: 'line', x1: 50, y1: 20 + i * 30, x2: 480, y2: 20 + i * 30, lineWidth: 0.5, lineColor: '#dddddd' })),
          
          // Y-Axis Labels
          ...Array.from({ length: 6 }, (_, i) => ({
            text: `$${((250000 / 5) * (5 - i)).toLocaleString()}`,
            absolutePosition: { x: 0, y: 15 + i * 30 },
            style: 'axisLabel'
          })),

          // Current NOI Bar
          { type: 'rect', x: 100, y: 140 - ((reportData.extracted_data?.noi_current || 0) / 250000 * 120), w: 80, h: (reportData.extracted_data?.noi_current || 0) / 250000 * 120, color: '#93c5fd' },
          { text: 'Current', absolutePosition: { x: 120, y: 145 }, style: 'barLabel' },

          // Pro-Forma NOI Bar
          { type: 'rect', x: 300, y: 140 - ((reportData.extracted_data?.noi_proforma || 0) / 250000 * 120), w: 80, h: (reportData.extracted_data?.noi_proforma || 0) / 250000 * 120, color: '#3b82f6' },
          { text: 'Pro-Forma', absolutePosition: { x: 315, y: 145 }, style: 'barLabel' }
        ],
        margin: [0, 20, 0, 20]
      },
    ],
    styles: {
      header: {
        fontSize: 14,
        bold: true,
        color: '#6b7280'
      },
      address: {
        fontSize: 24,
        bold: true,
        color: '#111827',
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      subheader: {
        fontSize: 12,
        color: '#6b7280',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: '#1a56db',
        margin: [0, 15, 0, 5]
      },
      footer: {
        fontSize: 10,
        color: '#6b7280'
      },
      axisLabel: {
        fontSize: 8,
        color: '#6b7280'
      },
      barLabel: {
        fontSize: 10,
        bold: true,
        color: 'white'
      }
    },
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.3
    }
  };

  return new Promise((resolve, reject) => {
    try {
      const pdf = pdfMake.createPdf(docDefinition);
      pdf.getBlob((blob) => {
        resolve(blob);
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      reject(error);
    }
  });
};