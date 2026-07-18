const SOURCE = 'canonical_institutional_pdf_repair_plan';
const VERSION = 2;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function normalizedDefect(defect, index) {
  const source = defect && typeof defect === 'object' ? defect : {};
  return {
    index,
    code: String(source.code || 'UNCLASSIFIED_PRESENTATION_DEFECT').trim().toUpperCase(),
    category: String(source.category || 'composition').trim().toLowerCase(),
    surfaceId: String(source.surfaceId || source.surface_id || 'report').trim(),
    pageNumber: Number.isInteger(Number(source.pageNumber)) && Number(source.pageNumber) > 0
      ? Number(source.pageNumber)
      : null,
    optional: source.optional === true,
    required: source.required === true,
  };
}

function requiresInternalSystemRepair(defect) {
  if (defect.required === true) return true;
  if (['number', 'source', 'authority', 'required_content'].includes(defect.category)) return true;
  return /(?:DISPLAYED_NUMBER_MISMATCH|SOURCE_RECEIPT_MISSING|REQUIRED_.+_MISSING|REQUIRED_CONTENT_LOSS)/.test(defect.code);
}

function actionForDefect(defect) {
  const common = {
    defectCode: defect.code,
    category: defect.category,
    surfaceId: defect.surfaceId,
    pageNumber: defect.pageNumber,
    valuesMayChange: false,
    sourcesMayChange: false,
    disclosuresMayChange: false,
  };
  if (requiresInternalSystemRepair(defect)) {
    return {
      ...common,
      action: 'internal_system_repair',
      repairBoundary: 'required_surface_or_authority_parity',
      rerenderRequired: true,
    };
  }
  if (defect.optional === true) {
    return {
      ...common,
      action: 'collapse_optional_surface',
      repairBoundary: 'optional_presentation_surface_only',
      rerenderRequired: true,
    };
  }
  return {
    ...common,
    action: 'recompose_and_rerender',
    repairBoundary: 'layout_and_pagination_only',
    rerenderRequired: true,
  };
}

export function buildInstitutionalPdfRepairPlan({ artifactId = null, defects = [] } = {}) {
  const normalizedDefects = (Array.isArray(defects) ? defects : []).map(normalizedDefect);
  const actions = normalizedDefects.map(actionForDefect);
  const hasInternalRepair = actions.some((action) => action.action === 'internal_system_repair');
  const publicationDisposition = hasInternalRepair
    ? 'hold_for_internal_repair'
    : actions.length > 0
      ? 'rerender_required'
      : 'certified';
  return deepFreeze({
    source: SOURCE,
    version: VERSION,
    artifactId: String(artifactId || '').trim() || null,
    scope: 'presentation_composition_only',
    publicationDisposition,
    customerDocumentFailure: false,
    actions,
    defectCount: normalizedDefects.length,
    authorityProtection: {
      valuesMayChange: false,
      sourcesMayChange: false,
      disclosuresMayChange: false,
      calculationsMayChange: false,
      classificationsMayChange: false,
      scenariosMayBeCreated: false,
    },
    doctrine: {
      optionalPresentationDefectCollapsesOnlyAffectedSurface: true,
      compositionDefectRecomposesWithoutChangingContent: true,
      requiredContentDefectIsInternalSystemRepair: true,
      customerDocumentFailureStateCreated: false,
      pageCountIsContentDriven: true,
      maximumAutomaticRecompositionAttempts: 1,
      recertifyAgainstOriginalApprovedSurface: true,
      extractionUncertaintyMayNotBecomeConfirmedDefect: true,
    },
  });
}

export const INSTITUTIONAL_PDF_REPAIR_PLAN_SOURCE = SOURCE;
export const INSTITUTIONAL_PDF_REPAIR_PLAN_VERSION = VERSION;
