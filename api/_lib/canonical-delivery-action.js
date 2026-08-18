export const CANONICAL_DELIVERY_ACTIONS = Object.freeze({
  DELIVER: 'DELIVER',
  DELIVER_WITH_QUALITY_INCIDENT: 'DELIVER_WITH_QUALITY_INCIDENT',
  INTERNAL_REPAIR_REQUIRED: 'INTERNAL_REPAIR_REQUIRED',
  CORE_INSUFFICIENT: 'CORE_INSUFFICIENT',
});

function truthy(value) {
  return value === true || String(value || '').trim().toLowerCase() === 'true';
}

function normalized(value) {
  return String(value || '').trim().toLowerCase();
}

export function resolveCanonicalDeliveryAction(decision = null, context = {}) {
  if (!decision || typeof decision !== 'object') return null;
  if (decision.source && decision.source !== 'canonical_delivery_decision') return null;

  const coreValid = truthy(decision.core_valid_required_coverage);
  const deliveryAllowed = truthy(decision.customer_delivery_allowed);
  const gateStatus = normalized(decision.delivery_gate_status);
  const disposition = normalized(
    context.publication_disposition ||
    context.publicationDisposition ||
    context.artifact_mode ||
    context.artifactMode ||
    context.status,
  );
  const qualityIncident =
    disposition.includes('quality_incident') ||
    context.publishable_with_quality_incident === true ||
    context.quality_incident === true ||
    (Array.isArray(context.quality_incident_codes) && context.quality_incident_codes.length > 0);

  if (deliveryAllowed) {
    return qualityIncident
      ? CANONICAL_DELIVERY_ACTIONS.DELIVER_WITH_QUALITY_INCIDENT
      : CANONICAL_DELIVERY_ACTIONS.DELIVER;
  }

  if (coreValid) return CANONICAL_DELIVERY_ACTIONS.INTERNAL_REPAIR_REQUIRED;
  if (gateStatus === 'user_needs_documents' || gateStatus === 'blocked') {
    return CANONICAL_DELIVERY_ACTIONS.CORE_INSUFFICIENT;
  }

  // Missing/ambiguous canonical evidence fails closed as an InvestorIQ repair state,
  // never as customer-document blame.
  return CANONICAL_DELIVERY_ACTIONS.INTERNAL_REPAIR_REQUIRED;
}

export function attachCanonicalDeliveryAction(payload = null) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const decision = payload.deliveryDecisionState && typeof payload.deliveryDecisionState === 'object'
    ? payload.deliveryDecisionState
    : null;
  const action = resolveCanonicalDeliveryAction(decision, {
    publication_disposition:
      payload.final_pdf_publication_quality_boss?.publication_disposition ||
      payload.publication_disposition || null,
    artifact_mode:
      payload.final_pdf_publication_quality_boss?.artifact_mode ||
      payload.artifact_mode || null,
    quality_incident_codes:
      payload.final_pdf_publication_quality_boss?.quality_incident_codes ||
      payload.quality_incident_codes || [],
    publishable_with_quality_incident:
      payload.final_pdf_publication_quality_boss?.status === 'publishable_with_quality_incident',
  });
  if (!action) return payload;

  const canonicalDecision = Object.freeze({ ...decision, action });
  return {
    ...payload,
    canonical_delivery_action: action,
    deliveryDecisionState: canonicalDecision,
  };
}
