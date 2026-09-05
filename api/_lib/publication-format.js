// Shared display rules. Never coerce absent evidence to a financial zero.
export function publicationNumber(value) {
  if (value === null || value === undefined || typeof value === 'boolean' ||
      (typeof value !== 'number' && typeof value !== 'string') ||
      (typeof value === 'string' && value.trim() === '')) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function publicationMoney(value, decimals = 0) {
  const number = publicationNumber(value);
  if (number === null) return 'Not available';
  // Ignore floating-point noise at a half-cent/half-dollar boundary. This is
  // display rounding only; no analytical operand is changed.
  const scale = 10 ** decimals;
  const absolute = Math.round((Math.abs(number) + Math.abs(number) * Number.EPSILON * 2) * scale) / scale;
  const text = absolute.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return number < 0 && absolute !== 0 ? `($${text})` : `$${text}`;
}

export function publicationPercent(value, digits = 1) {
  const number = publicationNumber(value);
  if (number === null) return 'Not available';
  const rounded = Number((number * 100).toFixed(digits));
  return `${(Object.is(rounded, -0) ? 0 : rounded).toFixed(digits)}%`;
}

export function publicationDate(value) {
  if (!value) return 'Date not stated';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not stated' : date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

export function publicationCushion(occupancy, breakEven) {
  if (publicationNumber(occupancy) === null || publicationNumber(breakEven) === null) return 'Not available';
  const delta = (occupancy - breakEven) * 100;
  return `${Math.abs(delta).toFixed(1)} pp ${delta < 0 ? 'below' : 'above'} break-even`;
}
