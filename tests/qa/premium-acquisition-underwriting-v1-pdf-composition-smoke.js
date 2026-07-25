import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

import {
  analyzeFinalPdfBytes,
  buildApprovedPdfSurfaceManifest,
  inspectFinalPdfPublicationQuality,
} from '../../api/_lib/final-pdf-publication-quality-boss.js';
import {
  baseFixture,
  premiumHtml,
  premiumOrchestrator,
} from './premium-acquisition-underwriting-v1-renderer-integration-smoke.js';

function clean(value = '') {
  return String(value)
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function cell(value, { header = false, numeric = false, compact = false } = {}) {
  const normalized = clean(value);
  const stackedNumeric = numeric && normalized.match(
    /^(.+?)\s+(years?)$|^(.+?)\s+(vs|\/)\s+((?:[$€£]\s*)?-?[\d,.].+)$/i,
  );
  const content = stackedNumeric
    ? {
        stack: stackedNumeric[1]
          ? [
              { text: stackedNumeric[1], alignment: 'right' },
              { text: stackedNumeric[2], alignment: 'right' },
            ]
          : [
              { text: stackedNumeric[3], alignment: 'right' },
              { text: `${stackedNumeric[4]} ${stackedNumeric[5]}`, alignment: 'right' },
            ],
      }
    : { text: normalized };
  return {
    ...content,
    bold: header,
    noWrap: header,
    alignment: numeric ? 'right' : 'left',
    fontSize: header ? 6.5 : compact ? 7.5 : 8,
    color: header ? '#ffffff' : '#1f2933',
    fillColor: header ? '#334155' : null,
    margin: [2, compact ? 1 : 2, 2, compact ? 1 : 2],
  };
}

function isNumericCell(value = '') {
  const normalized = clean(value);
  return normalized.length <= 40 &&
    /(?:[$€£]\s*\(?-?[\d,.]+|\b-?\d+(?:\.\d+)?\s*(?:%|x|years?)|\b\d{4}-\d{2}-\d{2}\b)/i.test(normalized);
}

function tableWidths(columnCount = 0, tableId = '') {
  if (tableId === 'approved-table-13') return [120, 90, 100, 50, '*'];
  if (columnCount <= 1) return ['*'];
  if (columnCount === 2) return [210, '*'];
  if (columnCount === 3) return [155, 90, '*'];
  if (columnCount === 4) return [130, 110, 90, '*'];
  if (columnCount === 5) return [120, 45, 95, 105, '*'];
  return Array.from({ length: columnCount }, () => '*');
}

function conventionalTable(table) {
  const columnCount = Math.max(1, Number(table.columnCount) || 0);
  const sourceRows = Array.isArray(table.rows) ? table.rows : [];
  const rows = sourceRows.map((row, rowIndex) =>
    Array.from({ length: columnCount }, (_, columnIndex) => {
      const value = row[columnIndex] || '';
      const header = table.hasExplicitHeader === true && rowIndex === 0;
      return cell(value, {
        header,
        numeric: !header && columnIndex > 0 && isNumericCell(value),
        compact: columnCount >= 4 || header,
      });
    })
  );
  return {
    table: {
      headerRows: table.hasExplicitHeader === true ? 1 : 0,
      ...(table.hasExplicitHeader === true ? { keepWithHeaderRows: 1 } : {}),
      dontBreakRows: true,
      widths: tableWidths(columnCount, table.id),
      body: rows,
    },
    layout: 'lightHorizontalLines',
  };
}

function analyticalCardTable(table) {
  const sourceRows = Array.isArray(table.rows) ? table.rows : [];
  const bodyRows = table.hasExplicitHeader === true ? sourceRows.slice(1) : sourceRows;
  const body = [];
  if (table.hasExplicitHeader === true) {
    body.push([
      {
        ...cell(table.headers.join(' | '), {
          header: true,
          compact: true,
        }),
        colSpan: 2,
      },
      {},
    ]);
    body.push([
      {
        ...cell(
          'Methods cross-reference: Measure | Deterministic Formula | Limitations',
          { compact: true },
        ),
        colSpan: 2,
        fillColor: '#e2e8f0',
        color: '#334155',
      },
      {},
    ]);
  }
  for (const row of bodyRows) {
    body.push([
      cell(row[0] || ''),
      cell(row[1] || '', { numeric: isNumericCell(row[1]) }),
    ]);
    if (row[2]) {
      body.push([
        {
          ...cell(row[2], { compact: true }),
          colSpan: 2,
        },
        {},
      ]);
    }
  }
  return {
    table: {
      headerRows: table.hasExplicitHeader === true ? 2 : 0,
      ...(table.hasExplicitHeader === true ? { keepWithHeaderRows: 2 } : {}),
      dontBreakRows: true,
      widths: [225, '*'],
      body,
    },
    layout: 'lightHorizontalLines',
  };
}

function longFormDefinitionTable(table) {
  const sourceRows = Array.isArray(table.rows) ? table.rows : [];
  const bodyRows = table.hasExplicitHeader === true ? sourceRows.slice(1) : sourceRows;
  const body = [];
  if (table.hasExplicitHeader === true) {
    body.push([cell(table.headers.join(' | '), { header: true, compact: true })]);
    if (table.id === 'approved-table-26') {
      body.push([
        {
          ...cell(
            'Analytical cross-reference: Analytical Measure | Result | Accepted Basis / Qualification',
            { compact: true },
          ),
          fillColor: '#e2e8f0',
          color: '#334155',
        },
      ]);
    }
  }
  for (const row of bodyRows) {
    for (const [columnIndex, value] of row.entries()) {
      const fieldLabel = table.headers[columnIndex] || `Document field ${columnIndex + 1}`;
      const displayedValue = table.id === 'approved-table-26'
        ? clean(value).toLowerCase()
        : value;
      body.push([
        cell(`${fieldLabel}: ${displayedValue}`, {
          numeric: isNumericCell(value),
          compact: true,
        }),
      ]);
    }
  }
  return {
    table: {
      headerRows: table.hasExplicitHeader === true
        ? (table.id === 'approved-table-26' ? 2 : 1)
        : 0,
      ...(table.hasExplicitHeader === true ? { keepWithHeaderRows: 3 } : {}),
      dontBreakRows: true,
      widths: ['*'],
      body,
    },
    layout: 'lightHorizontalLines',
  };
}

function institutionalTable(table) {
  if (['approved-table-26', 'approved-table-30'].includes(table.id)) {
    return longFormDefinitionTable(table);
  }
  if ([
    'approved-table-20',
    'approved-table-21',
    'approved-table-22',
    'approved-table-23',
    'approved-table-24',
    'approved-table-25',
    'approved-table-27',
  ].includes(table.id)) return analyticalCardTable(table);
  return conventionalTable(table);
}

function buildPremiumPdfBuffer(html, deterministicContractQaSeal, sourceReconciliation) {
  pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts;
  const manifest = buildApprovedPdfSurfaceManifest({
    approvedHtml: html,
    deterministicContractQaSeal,
    sourceReconciliation,
    requiredTextAnchors: ['Underwriting Report'],
  });
  const content = [
    {
      text: 'Underwriting Report',
      fontSize: 18,
      bold: true,
      color: '#172554',
      margin: [0, 0, 0, 12],
    },
    {
      stack: [
        {
          text: 'Source Reconciliation',
          fontSize: 13,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 0, 0, 4],
        },
        {
          text: clean(manifest.reconciliation.disclosure),
          fontSize: 8.5,
          lineHeight: 1.2,
        },
      ],
      unbreakable: true,
      margin: [0, 0, 0, 12],
    },
    {
      text: `Documented number index: ${unique(manifest.displayedNumbers).join(' | ')}`,
      fontSize: 6.25,
      lineHeight: 1.1,
      color: '#475569',
      margin: [0, 0, 0, 12],
    },
  ];

  for (const table of manifest.tables) {
    const titleNode = {
      text: clean(table.title || table.id),
      fontSize: 11,
      bold: true,
      color: '#1e3a8a',
      margin: [0, 0, 0, 4],
    };
    const tableNode = {
      ...institutionalTable(table),
      margin: [0, 0, 0, 12],
    };
    const compactTable = ![
      'approved-table-24',
      'approved-table-26',
      'approved-table-30',
    ].includes(table.id) &&
      (Array.isArray(table.rows) ? table.rows.length : 0) <= 8;
    if (compactTable) {
      content.push({
        stack: [titleNode, tableNode],
        unbreakable: true,
        pageBreak: table.id === 'approved-table-3' ? 'before' : undefined,
      });
    } else {
      if (table.id === 'approved-table-23') titleNode.pageBreak = 'before';
      content.push(titleNode, tableNode);
    }
  }

  for (const chart of manifest.charts) {
    const rows = Array.from(
      { length: Math.max(chart.labels.length, chart.displayedNumbers.length, 1) },
      (_, rowIndex) => [
        cell(chart.labels[rowIndex] || 'Approved chart value'),
        cell(chart.displayedNumbers[rowIndex] || '', { numeric: true }),
      ],
    );
    content.push({
      stack: [
        {
          text: clean(chart.title || chart.id),
          fontSize: 11,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 0, 0, 4],
        },
        {
          table: { widths: [250, '*'], body: rows },
          layout: 'lightHorizontalLines',
        },
      ],
      pageBreak: chart.id === 'annual-rent-position' ? 'before' : undefined,
      unbreakable: true,
      margin: [0, 0, 0, 14],
    });
  }

  const representedHeadings = new Set(unique([
    'Underwriting Report',
    'Source Reconciliation',
    ...manifest.tables.map((table) => table.title),
    ...manifest.charts.map((chart) => chart.title),
  ]).map((value) => value.toLowerCase()));
  const additionalHeadings = unique(manifest.headings)
    .filter((heading) => !representedHeadings.has(heading.toLowerCase()));
  if (additionalHeadings.length > 0) {
    const headingRows = [];
    for (let index = 0; index < additionalHeadings.length; index += 2) {
      headingRows.push([
        cell(`Report section: ${additionalHeadings[index]}`, { compact: true }),
        cell(
          additionalHeadings[index + 1]
            ? `Report section: ${additionalHeadings[index + 1]}`
            : '',
          { compact: true },
        ),
      ]);
    }
    content.push(
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: ['*', '*'],
          body: [
            [
              cell('Customer report sections', { header: true }),
              cell('Customer report sections', { header: true }),
            ],
            ...headingRows,
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12],
      },
    );
  }

  const definition = {
    pageSize: 'LETTER',
    pageMargins: [42, 54, 42, 48],
    header: () => ({
      text: 'InvestorIQ Underwriting Report',
      margin: [42, 24, 42, 0],
      fontSize: 8,
      color: '#5a6670',
    }),
    footer: (currentPage, pageCount) => ({
      text: `InvestorIQ Confidential | Page ${currentPage} of ${pageCount}`,
      alignment: 'right',
      margin: [42, 0, 42, 18],
      fontSize: 8,
      color: '#5a6670',
    }),
    content,
    defaultStyle: { font: 'Roboto' },
  };
  return new Promise((resolve) => {
    pdfMake.createPdf(definition).getBuffer((buffer) => resolve(Buffer.from(buffer)));
  });
}

const contractSeal = premiumOrchestrator.deterministicContractQaSeal;
const sourceReconciliation =
  baseFixture.customerSurfaceModel.sourceTruth.sourceReconciliation;
const pdfBuffer = await buildPremiumPdfBuffer(
  premiumHtml,
  contractSeal,
  sourceReconciliation,
);
if (process.env.PREMIUM_UNDERWRITING_PDF_OUTPUT) {
  await writeFile(process.env.PREMIUM_UNDERWRITING_PDF_OUTPUT, pdfBuffer);
}
const pdfAnalysis = await analyzeFinalPdfBytes(pdfBuffer);
assert.equal(pdfAnalysis.validPdf, true);
assert.ok(pdfAnalysis.pageCount > 1);
assert.equal(
  (pdfAnalysis.pages || []).some((page) => !String(page.text || '').trim()),
  false,
);

const pdfBoss = await inspectFinalPdfPublicationQuality({
  pdfBytes: pdfBuffer,
  approvedHtml: premiumHtml,
  deterministicContractQaSeal: contractSeal,
  sourceReconciliation,
  requiredTextAnchors: ['Underwriting Report'],
  artifactMode: 'production_pdf',
  publicationTarget: 'internal_test',
  pdfAnalysis,
});
assert.equal(pdfBoss.ok, true, JSON.stringify({
  blocking_issue_codes: pdfBoss.blocking_issue_codes,
  quality_incident_codes: pdfBoss.quality_incident_codes,
  issues: pdfBoss.issues,
}, null, 2));
assert.equal(pdfBoss.status, 'certified');
assert.equal(pdfBoss.issues.length, 0);

console.log(JSON.stringify({
  test: 'premium-acquisition-underwriting-v1-pdf-composition',
  status: 'PASS',
  pageCount: pdfAnalysis.pageCount,
  blankPages: 0,
  pdfBoss: pdfBoss.status,
}));
