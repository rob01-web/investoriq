export function isFiniteNumber(x) {
  const n = Number(x);
  return Number.isFinite(n);
}
export function isFinitePositive(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0;
}
export function materiallyDifferent(a, b, absoluteTolerance = 10, relativeTolerance = 0.02) {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  const delta = Math.abs(left - right);
  const scale = Math.max(Math.abs(left), Math.abs(right), 1);
  return delta > absoluteTolerance && delta / scale > relativeTolerance;
}
export function toRateRatio(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1.5 ? n / 100 : n; // treat 5.25 as 5.25% => 0.0525
}
export function toCapRatio(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1.5 ? n / 100 : n; // keep user-entered cap-rate conventions
}
