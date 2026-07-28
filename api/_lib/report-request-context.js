export function resolveReportTypeAndTier({
  bodyReportType = null,
  jobReportType = null,
} = {}) {
  const normalizeToken = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  const hasExplicitBodyType = String(bodyReportType || "").trim().length > 0;
  const hasExplicitJobType = String(jobReportType || "").trim().length > 0;
  const explicitRawToken = hasExplicitBodyType ? bodyReportType : hasExplicitJobType ? jobReportType : null;
  const normalizedExplicitToken = normalizeToken(explicitRawToken);
  const canonicalByToken = new Map([
    ["screening", "screening"],
    ["underwriting", "underwriting"],
    ["ic", "ic"],
    ["full_underwriting", "underwriting"],
    ["underwriting_report", "underwriting"],
    ["underwriting_v1", "underwriting"],
    ["tier_2", "underwriting"],
    ["tier2", "underwriting"],
  ]);
  const allowedTypes = ["screening", "underwriting", "ic"];
  const supportedAliases = [
    "full_underwriting",
    "underwriting_report",
    "underwriting_v1",
    "tier_2",
    "tier2",
  ];
  if (!hasExplicitBodyType && !hasExplicitJobType) {
    return {
      ok: true,
      reportType: "screening",
      reportTier: 1,
      effectiveReportMode: "screening_v1",
      usedDefault: true,
      explicitUnknown: false,
      providedToken: null,
      normalizedToken: "",
    };
  }
  const canonicalType = canonicalByToken.get(normalizedExplicitToken) || null;
  if (!canonicalType) {
    return {
      ok: false,
      explicitUnknown: true,
      providedToken: String(explicitRawToken || ""),
      normalizedToken: normalizedExplicitToken,
      allowedTypes,
      supportedAliases,
    };
  }
  const reportTier = canonicalType === "underwriting" ? 2 : canonicalType === "ic" ? 3 : 1;
  return {
    ok: true,
    reportType: canonicalType,
    reportTier,
    effectiveReportMode: canonicalType === "screening" ? "screening_v1" : "v1_core",
    usedDefault: false,
    explicitUnknown: false,
    providedToken: String(explicitRawToken || ""),
    normalizedToken: normalizedExplicitToken,
  };
}

export function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function normalizeOwnershipId(value) {
  return String(value || "").trim();
}

export function resolveReportGenerationOwnership({
  bodyUserId = null,
  jobId = null,
  jobUserId = null,
  authenticatedActorId = null,
  adminAuthorized = false,
} = {}) {
  const normalizedBodyUserId = normalizeOwnershipId(bodyUserId);
  const normalizedJobId = normalizeOwnershipId(jobId);
  const normalizedJobUserId = normalizeOwnershipId(jobUserId);
  const normalizedActorId = normalizeOwnershipId(authenticatedActorId);

  if (normalizedJobId) {
    if (!normalizedJobUserId) {
      return { ok: false, status: 404, error: "JOB_NOT_FOUND" };
    }
    if (normalizedBodyUserId && normalizedBodyUserId !== normalizedJobUserId) {
      return { ok: false, status: 403, error: "JOB_OWNERSHIP_MISMATCH" };
    }
    return {
      ok: true,
      effectiveUserId: normalizedJobUserId,
      ownershipSource: "analysis_jobs.user_id",
    };
  }

  if (normalizedBodyUserId) {
    if (!adminAuthorized && normalizedActorId && normalizedBodyUserId !== normalizedActorId) {
      return { ok: false, status: 403, error: "FORBIDDEN" };
    }
    if (!adminAuthorized && !normalizedActorId) {
      return { ok: false, status: 401, error: "UNAUTHORIZED" };
    }
    return {
      ok: true,
      effectiveUserId: normalizedBodyUserId,
      ownershipSource: adminAuthorized ? "admin_authorized_body_user_id" : "authenticated_actor",
    };
  }

  if (normalizedActorId && !adminAuthorized) {
    return {
      ok: true,
      effectiveUserId: normalizedActorId,
      ownershipSource: "authenticated_actor",
    };
  }

  return { ok: false, status: 400, error: "Missing userId" };
}
