import {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  resolvePremiumAcquisitionUnderwritingV1Activation,
} from './premium-acquisition-underwriting-v1-model.js';
import {
  validatePremiumAcquisitionUnderwritingV1ValidatedModel,
} from './premium-acquisition-underwriting-v1-validated-model.js';

const PREMIUM_RENDERER_SOURCE = 'premium_acquisition_underwriting_v1_renderer';
const PREMIUM_RENDERER_VERSION = 1;

const GROUPS = Object.freeze([
  Object.freeze({
    chapterKey: 'premium-operating-intelligence',
    chapterTitle: 'Premium Operating Intelligence',
    sections: Object.freeze([
      Object.freeze(['operatingPerformance', 'Operating Performance Analysis']),
      Object.freeze(['rentRollAndUnitEconomics', 'Rent Roll and Unit Economics']),
      Object.freeze(['expenseStructure', 'Expense Structure']),
    ]),
  }),
  Object.freeze({
    chapterKey: 'premium-debt-valuation',
    chapterTitle: 'Premium Debt and Valuation Analysis',
    sections: Object.freeze([
      Object.freeze(['currentAndProposedDebt', 'Current and Proposed Debt Comparison']),
      Object.freeze(['debtCapacityAndCoverage', 'Debt Capacity and Coverage']),
      Object.freeze(['valuationAndAppraisalBridge', 'Valuation and Appraisal Bridge']),
    ]),
  }),
  Object.freeze({
    chapterKey: 'premium-evidence-methods',
    chapterTitle: 'Premium Evidence and Methods',
    sections: Object.freeze([
      Object.freeze(['capitalPlanEvidence', 'Capital Plan Evidence']),
      Object.freeze(['sourceReconciliation', 'Source Reconciliation Analysis']),
      Object.freeze(['methodsDefinitionsAndLimitations', 'Methods, Definitions, and Limitations']),
    ]),
  }),
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function finite(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatMoney(value, maximumFractionDigits = 0) {
  const numeric = finite(value);
  if (numeric === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(numeric);
}

function formatNumber(value, maximumFractionDigits = 2) {
  const numeric = finite(value);
  if (numeric === null) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(numeric);
}

function formatResult(receipt) {
  const value = finite(receipt?.result);
  if (value === null) return '';
  const units = String(receipt?.units || '');
  if (units === 'ratio_x') return `${formatNumber(value, 2)}x`;
  if (units === 'ratio') {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (units.startsWith('currency')) {
    const showCents = /square_foot|per_unit_per_month/.test(units);
    return formatMoney(value, showCents ? 2 : 0);
  }
  if (units === 'units' || units === 'month_number') return formatNumber(value, 0);
  return formatNumber(
    value,
    Number.isInteger(receipt?.precision) ? Math.min(receipt.precision, 2) : 2,
  );
}

function formulaDisplay(formula) {
  return String(formula || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function customerSafeMethodText(value) {
  return formulaDisplay(value)
    .replace(/debt inclusive break even occupancy/gi, 'debt-inclusive operating break-even ratio')
    .replace(/\brefinanc\w*\b|\brefi\w*\b/gi, 'future financing')
    .replace(/\bDCF\b/gi, 'discounted cash-flow analysis')
    .replace(/\bequity return\b/gi, 'levered performance')
    .replace(/\bdeal score\b/gi, 'investment scoring')
    .replace(/\bfinal recommendation\b/gi, 'decision conclusion')
    .replace(/\bBUY\b|\bSELL\b|\bHOLD\b/g, 'transaction decision')
    .replace(/\bloan approval\b/gi, 'credit decision')
    .replace(/\blender commitment\b/gi, 'lender decision');
}

function customerSafeLabel(receipt) {
  if (/DebtInclusiveBreakEvenOccupancy$/.test(String(receipt?.calculationKey || ''))) {
    return String(receipt?.label || '')
      .replace(/Debt-Inclusive Break-Even Occupancy/gi, 'Debt-Inclusive Operating Break-Even Ratio');
  }
  return String(receipt?.label || '');
}

function calculatedReceipts(section) {
  return Array.isArray(section?.calculations)
    ? section.calculations.filter((receipt) => (
        receipt?.status === 'calculated' &&
        receipt?.sourceBound === true &&
        Number.isFinite(receipt?.result)
      ))
    : [];
}

function renderCalculationTable(receipts) {
  if (receipts.length === 0) return '';
  const rows = receipts.map((receipt) => {
    const qualification = String(receipt?.qualification || '').trim();
    return `<tr data-iq-premium-calculation="${escapeHtml(receipt.calculationKey)}">
      <td>${escapeHtml(customerSafeLabel(receipt))}</td>
      <td>${escapeHtml(formatResult(receipt))}</td>
      <td>${escapeHtml(customerSafeMethodText(receipt.formula))}${qualification ? `<div class="small" style="margin-top:4px;color:var(--ink-4);font-weight:400;text-align:left;">${escapeHtml(customerSafeMethodText(qualification))}</div>` : ''}</td>
    </tr>`;
  }).join('');
  return `<table class="detail-table" data-iq-premium-table="calculations">
    <thead><tr><th>Analytical Measure</th><th>Result</th><th>Accepted Basis / Qualification</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function methodsRows(section) {
  const methodsFact = Array.isArray(section?.facts)
    ? section.facts.find((fact) => fact?.factKey === 'methods_definitions_and_limitations')
    : null;
  const rows = Array.isArray(methodsFact?.value) ? methodsFact.value : [];
  if (rows.length === 0) return '';
  return `<table class="detail-table" data-iq-premium-table="methods">
    <thead><tr><th>Measure</th><th>Deterministic Formula</th><th>Limitations</th></tr></thead>
    <tbody>${rows.map((row) => {
      const limitations = [
        String(row?.qualification || '').trim(),
        ...(Array.isArray(row?.limitationCodes)
          ? row.limitationCodes.map((code) => customerSafeMethodText(code))
          : []),
      ].filter(Boolean);
      return `<tr>
        <td>${escapeHtml(customerSafeLabel(row))}</td>
        <td>${escapeHtml(customerSafeMethodText(row?.formula))}</td>
        <td>${escapeHtml(customerSafeMethodText(limitations.join(' | ') || 'No additional limitation stated.'))}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

function renderSection(sectionKey, title, section) {
  if (section?.status !== 'eligible' || section?.customerSurfaceEligible !== true) return '';
  const body = sectionKey === 'methodsDefinitionsAndLimitations'
    ? methodsRows(section)
    : renderCalculationTable(calculatedReceipts(section));
  if (!body) return '';
  return `<section class="section" data-iq-premium-section="${escapeHtml(sectionKey)}">
    <div class="section-header"><span class="section-header-title">${escapeHtml(title)}</span></div>
    ${body}
  </section>`;
}

function renderPremiumAcquisitionUnderwritingV1Expansion({
  premiumUnderwritingModel = null,
  premiumUnderwritingCapabilityEnabled = false,
  reportSurfaceVersion = null,
} = {}) {
  const activation = resolvePremiumAcquisitionUnderwritingV1Activation({
    capabilityEnabled: premiumUnderwritingCapabilityEnabled,
    reportSurfaceVersion,
  });
  if (!activation.requested) {
    return {
      html: '',
      status: activation.status,
      activation,
      renderedSectionCount: 0,
    };
  }

  const validation = validatePremiumAcquisitionUnderwritingV1ValidatedModel(
    premiumUnderwritingModel,
  );
  if (
    !validation.ok ||
    premiumUnderwritingModel?.validation?.ok !== true ||
    premiumUnderwritingModel?.validation?.status !== 'valid_disconnected_expansion_model'
  ) {
    return {
      html: '',
      status: 'invalid_premium_model',
      activation,
      renderedSectionCount: 0,
      validation,
    };
  }

  const chapters = [];
  let renderedSectionCount = 0;
  for (const group of GROUPS) {
    const sections = group.sections.map(([sectionKey, title]) => {
      const html = renderSection(
        sectionKey,
        title,
        premiumUnderwritingModel.sections?.[sectionKey],
      );
      if (html) renderedSectionCount += 1;
      return html;
    }).filter(Boolean);
    if (sections.length === 0) continue;
    chapters.push(`<section class="institutional-chapter" data-iq-chapter="${escapeHtml(group.chapterKey)}" data-iq-premium-underwriting-v1="true">
      <div class="chapter-heading">${escapeHtml(group.chapterTitle)}</div>
      ${sections.join('')}
    </section>`);
  }

  return {
    html: `<!-- BEGIN PREMIUM_ACQUISITION_UNDERWRITING_V1 -->${chapters.join('')}<!-- END PREMIUM_ACQUISITION_UNDERWRITING_V1 -->`,
    status: chapters.length > 0 ? 'rendered' : 'no_eligible_premium_sections',
    activation: {
      ...activation,
      reportSurfaceVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
    },
    renderedSectionCount,
    validation,
  };
}

const PREMIUM_ACQUISITION_UNDERWRITING_V1_RENDERER_CONTRACT = Object.freeze({
  source: PREMIUM_RENDERER_SOURCE,
  rendererVersion: PREMIUM_RENDERER_VERSION,
  featureFlagRequired: true,
  premiumSurfaceVersionRequired: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  validatedModelRequired: true,
  recalculationAllowed: false,
  baseRendererMutationAllowed: false,
  publicationAuthority: false,
});

export {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_RENDERER_CONTRACT,
  PREMIUM_RENDERER_SOURCE,
  PREMIUM_RENDERER_VERSION,
  renderPremiumAcquisitionUnderwritingV1Expansion,
};
