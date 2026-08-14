const DEFAULT_ADMIN_EMAILS = ['hello@investoriq.tech'];

function readBearerToken(req) {
  const authorization = String(req?.headers?.authorization || '').trim();
  if (!authorization.startsWith('Bearer ')) return '';
  return authorization.slice('Bearer '.length).trim();
}

function getAdminEmails() {
  const configured = String(process.env.INVESTORIQ_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ADMIN_EMAILS;
}

export function isInvestorIQAdmin(actor) {
  const email = String(actor?.email || '').trim().toLowerCase();
  return Boolean(email) && getAdminEmails().includes(email);
}

function normalizeOwnershipId(value) {
  return String(value || '').trim();
}

function readJwtPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadBase64 + '='.repeat((4 - (payloadBase64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json);
    return payload && typeof payload === 'object' ? payload : null;
  } catch (err) {
    return null;
  }
}

function resolveSessionIdentifier(token) {
  const payload = readJwtPayload(token);
  if (!payload) return { sessionIdentifier: null, sessionIdentifierSource: null };

  const sessionId = String(payload.session_id || '').trim();
  if (sessionId) {
    return {
      sessionIdentifier: sessionId,
      sessionIdentifierSource: 'jwt.session_id',
    };
  }

  const jti = String(payload.jti || '').trim();
  if (jti) {
    return {
      sessionIdentifier: jti,
      sessionIdentifierSource: 'jwt.jti',
    };
  }

  return { sessionIdentifier: null, sessionIdentifierSource: null };
}

export function resolveAuthenticatedResourceOwnership({
  auth = null,
  resourceOwnerId = null,
  allowAdminBypass = false,
  requireResourceOwnerId = true,
  resourceType = 'resource',
} = {}) {
  if (!auth || auth.ok !== true) {
    return {
      ok: false,
      status: auth?.status || 401,
      error: auth?.error || 'UNAUTHORIZED',
    };
  }

  const actor = auth.actor || null;
  const actorId = normalizeOwnershipId(actor?.id);
  const ownerId = normalizeOwnershipId(resourceOwnerId);
  const adminAuthorized = allowAdminBypass && isInvestorIQAdmin(actor);

  if (!actorId) {
    return { ok: false, status: 401, error: 'UNAUTHORIZED' };
  }

  if (!ownerId && requireResourceOwnerId) {
    return {
      ok: false,
      status: 403,
      error: 'FORBIDDEN',
      resourceType,
      actorId,
      resourceOwnerId: ownerId || null,
    };
  }

  if (ownerId && ownerId !== actorId && !adminAuthorized) {
    return {
      ok: false,
      status: 403,
      error: 'FORBIDDEN',
      resourceType,
      actorId,
      resourceOwnerId: ownerId,
    };
  }

  return {
    ok: true,
    actor,
    actorId,
    adminAuthorized,
    resourceType,
    resourceOwnerId: ownerId || actorId,
  };
}

export async function resolveAuthenticatedActor(
  req,
  { createClientImpl = null } = {},
) {
  const token = readBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: 'UNAUTHORIZED' };
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 500,
      error: 'SERVER_MISCONFIGURED',
      missing: [
        !supabaseUrl ? 'SUPABASE_URL' : null,
        !supabaseAnonKey ? 'SUPABASE_ANON_KEY' : null,
      ].filter(Boolean),
    };
  }

  const createAuthClient =
    createClientImpl || (await import('@supabase/supabase-js')).createClient;
  const supabaseAuth = createAuthClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabaseAuth.auth.getUser(token);
  const user = data?.user || null;
  if (error || !user?.id) {
    return { ok: false, status: 401, error: 'UNAUTHORIZED' };
  }

  const { sessionIdentifier, sessionIdentifierSource } = resolveSessionIdentifier(token);

  return {
    ok: true,
    token,
    actor: {
      id: user.id,
      email: user.email || null,
    },
    sessionIdentifier,
    sessionIdentifierSource,
  };
}
