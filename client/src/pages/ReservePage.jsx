import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { addDays, CLOSED_WEEKDAYS, formatDate, formatTime, MAX_DAYS_AHEAD, MAX_PARTY, nextOpenDate, parseISODate, toISODate } from '../utils.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const EMPTY = { name: '', email: '', phone: '', notes: '' };

function validateDate(value) {
  const d = parseISODate(value);
  if (!d) return 'Please choose a date.';
  const today = parseISODate(toISODate(new Date()));
  if (d < today) return 'That date is in the past.';
  if (d > addDays(today, MAX_DAYS_AHEAD)) return `You can book up to ${MAX_DAYS_AHEAD} days ahead.`;
  if (CLOSED_WEEKDAYS.includes(d.getDay())) return 'We are closed on Mondays — please pick another day.';
  return '';
}

function validateContact(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email address.';
  if (!PHONE_RE.test(f.phone.trim())) e.phone = 'Please enter a valid phone number.';
  if (f.notes.length > 500) e.notes = 'Notes can be at most 500 characters.';
  return e;
}

export default function ReservePage() {
  const today = toISODate(new Date());
  const maxDate = toISODate(addDays(new Date(), MAX_DAYS_AHEAD));
  const [date, setDate] = useState(nextOpenDate());
  const [partySize, setPartySize] = useState(2);
  const [time, setTime] = useState('');
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [reload, setReload] = useState(0);

  const dateError = useMemo(() => validateDate(date), [date]);

  useEffect(() => {
    setTime('');
    if (dateError) { setDay(null); return; }
    let cancelled = false;
    setLoading(true);
    api(`/availability?date=${date}&partySize=${partySize}`)
      .then((d) => { if (!cancelled) setDay(d); })
      .catch((e) => { if (!cancelled) setDay({ open: false, reason: e.message, slots: [] }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date, partySize, dateError, reload]);

  const services = useMemo(() => {
    const groups = {};
    (day?.slots || []).forEach((s) => { (groups[s.service] ||= []).push(s); });
    return Object.entries(groups);
  }, [day]);

  const update = (name) => (e) => {
    const value = e.target.value;
    setFields((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: validateContact({ ...fields, [name]: value })[name] }));
  };

  async function submit(e) {
    e.preventDefault();
    setSubmitError('');
    const errs = validateContact(fields);
    if (dateError) errs.date = dateError;
    if (!time) errs.time = 'Please choose a time.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      setSubmitError('Please check the highlighted fields.');
      document.querySelector('[aria-invalid="true"], .slot-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api('/reservations', { method: 'POST', body: { ...fields, date, time, partySize } });
      setConfirmed(res);
    } catch (err) {
      setSubmitError(err.message);
      setErrors(err.details || {});
      if (err.status === 409) setReload((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <section className="section page">
        <div className="container narrow">
          <div className="confirm card">
            <div className="confirm-icon" aria-hidden="true">✓</div>
            <h1>You're booked, {confirmed.name.split(' ')[0]}!</h1>
            <p className="muted">We look forward to welcoming you. Keep your booking reference handy.</p>
            <dl className="summary">
              <div><dt>Reference</dt><dd className="code">{confirmed.code}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(confirmed.date)}</dd></div>
              <div><dt>Time</dt><dd>{formatTime(confirmed.time)}</dd></div>
              <div><dt>Guests</dt><dd>{confirmed.partySize}</dd></div>
            </dl>
            <div className="hero-actions center-row">
              <button className="btn" onClick={() => { setConfirmed(null); setFields(EMPTY); setErrors({}); setReload((n) => n + 1); }}>Make another booking</button>
              <Link to="/menu" className="btn btn-outline">Browse the menu</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section page">
      <div className="container">
        <header className="page-head">
          <p className="eyebrow">Reservations</p>
          <h1>Book a table</h1>
          <p className="muted">Choose a date and party size to see available times. Groups larger than {MAX_PARTY}? Please call us.</p>
        </header>

        <form className="reserve" onSubmit={submit} noValidate>
          <div className="card step">
            <h2><span className="step-n">1</span> When &amp; how many</h2>
            <div className="row-2">
              <div className="field">
                <label htmlFor="date">Date</label>
                <input id="date" type="date" value={date} min={today} max={maxDate} required
                  onChange={(e) => setDate(e.target.value)} aria-invalid={Boolean(dateError)} aria-describedby="date-err" />
                <p id="date-err" className="field-error">{dateError}</p>
              </div>
              <div className="field">
                <label htmlFor="party">Guests</label>
                <select id="party" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}>
                  {Array.from({ length: MAX_PARTY }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
                </select>
              </div>
            </div>

            <fieldset className="slots" aria-describedby="time-err">
              <legend>Available times {date && !dateError && <span className="muted">· {formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>}</legend>
              {loading && <p className="muted">Checking availability…</p>}
              {!loading && day?.reason && <p className="alert info">{day.reason}</p>}
              {!loading && services.map(([service, slots]) => (
                <div key={service} className="service">
                  <p className="service-name">{service}</p>
                  <div className="slot-grid">
                    {slots.map((s) => (
                      <button type="button" key={s.time} disabled={!s.available} aria-pressed={time === s.time}
                        className={`slot${time === s.time ? ' selected' : ''}`} onClick={() => { setTime(s.time); setErrors((er) => ({ ...er, time: undefined })); }}>
                        {formatTime(s.time)}
                        {!s.available && <span className="sr-only"> (unavailable)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p id="time-err" className="field-error slot-error" role="alert">{errors.time}</p>
            </fieldset>
          </div>

          <div className="card step">
            <h2><span className="step-n">2</span> Your details</h2>
            <div className="row-2">
              <Field id="name" label="Full name" error={errors.name}>
                <input id="name" value={fields.name} onChange={update('name')} autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.name)} aria-describedby="name-err" />
              </Field>
              <Field id="phone" label="Phone" error={errors.phone}>
                <input id="phone" type="tel" value={fields.phone} onChange={update('phone')} autoComplete="tel" placeholder="+1 555 123 4567" aria-invalid={Boolean(errors.phone)} aria-describedby="phone-err" />
              </Field>
            </div>
            <Field id="email" label="Email" error={errors.email}>
              <input id="email" type="email" value={fields.email} onChange={update('email')} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby="email-err" />
            </Field>
            <Field id="notes" label="Notes (optional)" error={errors.notes}>
              <textarea id="notes" rows={3} value={fields.notes} onChange={update('notes')} maxLength={500} placeholder="Allergies, special occasion, high chair…" aria-describedby="notes-err" />
            </Field>
          </div>

          <aside className="card summary-card" aria-label="Booking summary">
            <h2>Your booking</h2>
            <dl className="summary">
              <div><dt>Date</dt><dd>{date && !dateError ? formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}</dd></div>
              <div><dt>Time</dt><dd>{time ? formatTime(time) : '—'}</dd></div>
              <div><dt>Guests</dt><dd>{partySize}</dd></div>
            </dl>
            {submitError && <p className="alert error" role="alert">{submitError}</p>}
            <button className="btn btn-block" type="submit" disabled={submitting}>{submitting ? 'Booking…' : 'Confirm reservation'}</button>
            <p className="muted small">Instant confirmation. Tables are held for 15 minutes after your booking time.</p>
          </aside>
        </form>
      </div>
    </section>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      <p id={`${id}-err`} className="field-error">{error}</p>
    </div>
  );
}
