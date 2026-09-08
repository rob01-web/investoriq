const DEFAULT_AUTH_RETURN_PATH = '/dashboard';
const INTERNAL_ORIGIN = 'https://investoriq.local';

export function sanitizeAuthReturnPath(value, fallback = DEFAULT_AUTH_RETURN_PATH) {
  const safeFallback = String(fallback || DEFAULT_AUTH_RETURN_PATH).trim() || DEFAULT_AUTH_RETURN_PATH;
  const candidate = String(value || '').trim();

  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return safeFallback;
  }

  try {
    const url = new URL(candidate, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN || !url.pathname.startsWith('/')) {
      return safeFallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return safeFallback;
  }
}

export function resolveAuthReturnPath(search = '', fallback = DEFAULT_AUTH_RETURN_PATH) {
  try {
    const params = new URLSearchParams(String(search || ''));
    return sanitizeAuthReturnPath(params.get('next'), fallback);
  } catch {
    return sanitizeAuthReturnPath('', fallback);
  }
}

export function buildAuthRoute(route, returnPath, fallback = DEFAULT_AUTH_RETURN_PATH) {
  const baseRoute = String(route || '').trim();
  const safeReturnPath = sanitizeAuthReturnPath(returnPath, fallback);
  if (!baseRoute) return safeReturnPath;
  if (safeReturnPath === fallback) return baseRoute;
  return `${baseRoute}?next=${encodeURIComponent(safeReturnPath)}`;
}
