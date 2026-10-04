import { dateError, partySizeError, slotsForDay } from './availability.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

/** Validates a reservation request. Returns { value } or { errors: { field: message } }. */
export function validateReservation(body = {}, now = new Date()) {
  const errors = {};
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const notes = String(body.notes ?? '').trim();
  const date = String(body.date ?? '');
  const time = String(body.time ?? '');
  const partySize = Number(body.partySize);

  if (name.length < 2 || name.length > 80) errors.name = 'Please enter your name (2–80 characters).';
  if (!EMAIL_RE.test(email) || email.length > 150) errors.email = 'Please enter a valid email address.';
  if (!PHONE_RE.test(phone)) errors.phone = 'Please enter a valid phone number.';
  if (notes.length > 500) errors.notes = 'Notes can be at most 500 characters.';
  const dErr = dateError(date, now);
  if (dErr) errors.date = dErr;
  const pErr = partySizeError(partySize);
  if (pErr) errors.partySize = pErr;
  if (!slotsForDay().some((s) => s.time === time)) errors.time = 'Please choose one of the available times.';

  if (Object.keys(errors).length) return { errors };
  return { value: { name, email, phone, notes, date, time, partySize } };
}
