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

  return {
    ok: true,
    token,
    actor: {
      id: user.id,
      email: user.email || null,
    },
  };
}
