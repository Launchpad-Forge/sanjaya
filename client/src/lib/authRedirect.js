// Only local app destinations are accepted, including after an OAuth round trip.
export function safeAuthDestination(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/app';
  const target = new URL(value, 'https://sanjaya.invalid');
  if (target.origin !== 'https://sanjaya.invalid' || /^\/(login|register|auth\/callback)(\/|$)/.test(target.pathname)) return '/app';
  return target.pathname + target.search + target.hash;
}
