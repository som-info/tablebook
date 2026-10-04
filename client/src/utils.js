const pad = (n) => String(n).padStart(2, '0');
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }

export function parseISODate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : null;
}

export const formatDate = (s, opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) =>
  parseISODate(s)?.toLocaleDateString('en-US', opts) ?? s;

export const formatTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const price = (n) => `$${n.toFixed(n % 1 ? 2 : 0)}`;

export const CLOSED_WEEKDAYS = [1]; // Monday – mirrors server/src/restaurant.js
export const MAX_PARTY = 8;
export const MAX_DAYS_AHEAD = 60;

export function nextOpenDate(from = new Date()) {
  let d = new Date(from);
  while (CLOSED_WEEKDAYS.includes(d.getDay())) d = addDays(d, 1);
  return toISODate(d);
}
