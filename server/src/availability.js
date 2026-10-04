import { restaurant as defaults } from './restaurant.js';

export const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const toHHMM = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const pad = (n) => String(n).padStart(2, '0');
export const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parses YYYY-MM-DD as a local calendar date; returns null when invalid. */
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

/** All bookable times for a date (ignores existing bookings). */
export function slotsForDay(r = defaults) {
  const out = [];
  for (const s of r.services) {
    for (let t = toMinutes(s.firstSeating); t <= toMinutes(s.lastSeating); t += r.slotMinutes) out.push({ time: toHHMM(t), service: s.name });
  }
  return out;
}

/** Checks whether a date can be booked at all. Returns an error string or null. */
export function dateError(dateStr, now = new Date(), r = defaults) {
  const date = parseDate(dateStr);
  if (!date) return 'Please choose a valid date.';
  const today = parseDate(localDate(now));
  const days = Math.round((date - today) / 86400000);
  if (days < 0) return 'That date is in the past.';
  if (days > r.maxDaysAhead) return `Reservations open ${r.maxDaysAhead} days in advance.`;
  if (r.closedWeekdays.includes(date.getDay())) return `${r.name} is closed on ${date.toLocaleDateString('en-US', { weekday: 'long' })}s.`;
  return null;
}

export function partySizeError(size, r = defaults) {
  if (!Number.isInteger(size) || size < 1) return 'Party size must be at least 1.';
  if (size > r.maxPartySize) return `For groups larger than ${r.maxPartySize}, please call us.`;
  return null;
}

/**
 * Finds the smallest free table that fits the party at a given date/time.
 * A table is busy if any active reservation on it overlaps [time, time + diningMinutes).
 */
export function findTable({ date, time, partySize, reservations, r = defaults, ignoreId = null }) {
  const start = toMinutes(time);
  const end = start + r.diningMinutes;
  const busy = new Set(
    reservations
      .filter((b) => b.date === date && b.status !== 'cancelled' && b.id !== ignoreId)
      .filter((b) => { const s = toMinutes(b.time); return s < end && start < s + r.diningMinutes; })
      .map((b) => b.tableId),
  );
  return [...r.tables].sort((a, b) => a.seats - b.seats).find((t) => t.seats >= partySize && !busy.has(t.id)) || null;
}

/** Availability for a whole day: every slot with an `available` flag. */
export function availability({ date, partySize, reservations, now = new Date(), r = defaults }) {
  const err = dateError(date, now, r) || partySizeError(partySize, r);
  if (err) return { date, partySize, open: false, reason: err, slots: [] };
  const isToday = date === localDate(now);
  const cutoff = now.getHours() * 60 + now.getMinutes() + r.minLeadMinutes;
  const slots = slotsForDay(r).map((s) => {
    const tooSoon = isToday && toMinutes(s.time) < cutoff;
    const table = tooSoon ? null : findTable({ date, time: s.time, partySize, reservations, r });
    return { ...s, available: Boolean(table) };
  });
  const reason = slots.some((s) => s.available) ? undefined : 'Fully booked for this party size — please try another date.';
  return { date, partySize, open: true, reason, slots };
}
