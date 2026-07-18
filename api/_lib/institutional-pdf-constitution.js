const CONSTITUTION_SOURCE = 'canonical_institutional_pdf_constitution';
const CONSTITUTION_VERSION = 2;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assembleConstitution() {
  return {
    source: CONSTITUTION_SOURCE,
    constitutionVersion: CONSTITUTION_VERSION,
    scope: 'institutional_composition_and_page_certification',
    authority: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      financialFactCreating: false,
      calculationCreating: false,
      scenarioCreating: false,
      classificationCreating: false,
      narrativeFabricationAllowed: false,
      approvedCustomerSurfaceConsumeOnly: true,
      canonicalReceiptConsumeOnly: true,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
    },
    composition: {
      universalPageCountRequired: null,
      pageCountHardcoded: false,
      contentDrivenPaginationRequired: true,
      institutionalInformationHierarchyRequired: true,
      repeatedDecisionContentAllowed: false,
      rawSourceFilenamesLimitedToSourceRegister: true,
      customerSafeLanguageRequired: true,
      optionalUnsupportedSurfacePolicy: 'collapse_or_omit',
      requiredCoreSurfacePolicy: 'preserve_exact_approved_content',
    },
    charts: {
      exactCanonicalValueRequired: true,
      canonicalCalculationReceiptAllowed: true,
      approvedScenarioPolicyRequiredForScenarioSeries: true,
      hardcodedFinancialSeriesAllowed: false,
      inferredBenchmarkAllowed: false,
      missingInputPolicy: 'collapse_chart',
      dataReceiptRequired: true,
      displayedLabelParityRequired: true,
    },
    tables: {
      approvedSurfaceParityRequired: true,
      numericColumnAlignmentRequired: true,
      repeatedHeaderRequiredAcrossPageBreak: true,
      rowSplitAllowed: false,
      clippedCellAllowed: false,
      unreadableTextAllowed: false,
      sourceRegisterWrappingRequired: true,
    },
    pagination: {
      majorSectionBreaksOnly: true,
      headingWithFollowingContentRequired: true,
      orphanHeadingAllowed: false,
      blankPageAllowed: false,
      nearlyBlankPageAllowed: false,
      overflowAllowed: false,
      contentOverlapAllowed: false,
      runningHeaderRequiredOnContentPages: true,
      runningFooterRequiredOnContentPages: true,
      pageNumberRequiredOnContentPages: true,
      optionalSurfaceMayOwnForcedPage: false,
    },
    language: {
      internalImplementationLanguageAllowed: false,
      prohibitedPunctuationAllowed: false,
      buySellLanguageAllowed: false,
      unsupportedRecommendationAllowed: false,
      sourceLimitationDisclosurePreservedExactly: true,
    },
    repair: {
      deterministicOnly: true,
      maximumAutomaticRecompositionAttempts: 1,
      recertifyAgainstOriginalApprovedSurface: true,
      repairSequence: [
        'recompose_adjacent_sections',
        'apply_approved_spacing_bounds',
        'move_or_split_table_at_row_boundary',
        'collapse_optional_surface',
        'single_bounded_conservative_recomposition',
        'rerender_and_recertify',
      ],
      numericValueMutationAllowed: false,
      labelMeaningMutationAllowed: false,
      sourceDecisionMutationAllowed: false,
      disclosureMutationAllowed: false,
      optionalPresentationFailureMayFailCustomerReport: false,
      unresolvedRequiredSurfaceFailureClass: 'internal_system_failure',
      customerDocumentFailure: false,
    },
    certification: {
      pageByPageRequired: true,
      pdfExtractionFragmentTolerance: 'ordered_exact_glyphs_only',
      inferredValueReconstructionAllowed: false,
      runningNavigationExcludedFromTableReadability: true,
      alignmentRequiresApprovedTableRowScope: true,
      certificationDimensions: [
        'geometry',
        'content_density',
        'heading_hierarchy',
        'tables',
        'charts',
        'numbers',
        'page_breaks',
        'spacing',
        'alignment',
        'running_navigation',
        'customer_language',
        'approved_surface_parity',
      ],
      pageReceiptRequiredFields: [
        'pageNumber',
        'sectionIds',
        'headings',
        'tables',
        'charts',
        'displayedNumbers',
        'geometry',
        'defects',
        'status',
      ],
      allowedPageStatuses: [
        'pass',
        'repair_required',
        'optional_surface_collapse_required',
        'internal_delivery_failure',
      ],
      everyApprovedTableCertified: true,
      everyApprovedChartCertified: true,
      everyApprovedNumberCertified: true,
      everyHeadingCertified: true,
      everyPageBreakCertified: true,
      everySpacingRuleCertified: true,
      everyAlignmentCertified: true,
    },
    publication: {
      testWatermarkExcludedFromInstitutionalScoring: true,
      testModeExternalPublicationAllowed: false,
      institutionalCertificationRequiredForExternalPublication: true,
      presentationIssueCustomerDocumentFailure: false,
      optionalSectionIssueMayBlockValidatedCorePublication: false,
    },
  };
}

export function buildCanonicalInstitutionalPdfConstitution() {
  return deepFreeze(assembleConstitution());
}

export function isCanonicalInstitutionalPdfConstitution(value) {
  if (!value || typeof value !== 'object') return false;
  return JSON.stringify(value) === JSON.stringify(assembleConstitution());
}

export const INSTITUTIONAL_PDF_CONSTITUTION = buildCanonicalInstitutionalPdfConstitution();
