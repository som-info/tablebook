import fs from 'node:fs';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { availability, findTable } from './availability.js';
import { menu } from './menu.js';
import { restaurant } from './restaurant.js';
import { ReservationStore } from './store.js';
import { validateReservation } from './validate.js';

const STATUSES = ['confirmed', 'seated', 'completed', 'cancelled', 'no-show'];

function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Builds the Express app. `now` can be injected for deterministic tests.
 */
export function createApp({ dataFile = null, adminKey = 'admin-demo', clientOrigin = ['http://localhost:5173'], clientDist = null, now = () => new Date() } = {}) {
  const app = express();
  const store = new ReservationStore(dataFile);

  app.disable('x-powered-by');
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/restaurant', (_req, res) => {
    const { name, services, maxPartySize, maxDaysAhead, closedWeekdays } = restaurant;
    res.json({ name, services, maxPartySize, maxDaysAhead, closedWeekdays });
  });

  app.get('/api/menu', (_req, res) => res.json(menu));

  app.get('/api/availability', (req, res) => {
    const partySize = Number(req.query.partySize ?? 2);
    res.json(availability({ date: String(req.query.date ?? ''), partySize, reservations: store.all(), now: now() }));
  });

  app.post('/api/reservations', (req, res) => {
    const { value, errors } = validateReservation(req.body, now());
    if (errors) return res.status(400).json({ error: 'Please check the highlighted fields.', details: errors });

    const day = availability({ date: value.date, partySize: value.partySize, reservations: store.all(), now: now() });
    const slot = day.slots.find((s) => s.time === value.time);
    const table = slot?.available && findTable({ ...value, reservations: store.all() });
    if (!table) {
      return res.status(409).json({ error: 'Sorry, that time was just booked. Please choose another time.', details: { time: 'No longer available.' } });
    }
    const reservation = store.create({ ...value, tableId: table.id });
    const { email, phone, ...publicFields } = reservation;
    res.status(201).json(publicFields);
  });

  // ---- Admin (protected by X-Admin-Key) ----
  const admin = express.Router();
  admin.use((req, res, next) => {
    if (!safeEqual(req.get('x-admin-key') || '', adminKey)) return res.status(401).json({ error: 'Invalid admin key.' });
    next();
  });
  admin.get('/reservations', (req, res) => {
    const { date, status, q } = req.query;
    let list = [...store.all()];
    if (date) list = list.filter((r) => r.date === date);
    if (status) list = list.filter((r) => r.status === status);
    if (q) {
      const needle = String(q).toLowerCase();
      list = list.filter((r) => [r.name, r.email, r.phone, r.code].some((f) => f.toLowerCase().includes(needle)));
    }
    list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    res.json(list);
  });
  admin.patch('/reservations/:id', (req, res) => {
    const id = Number(req.params.id);
    const current = store.get(id);
    if (!current) return res.status(404).json({ error: 'Reservation not found.' });
    const { status } = req.body ?? {};
    if (!STATUSES.includes(status)) return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(', ')}.` });
    if (current.status === 'cancelled' && status !== 'cancelled') {
      // Re-activating a booking: make sure its table is still free.
      const table = findTable({ ...current, reservations: store.all(), ignoreId: id });
      if (!table) return res.status(409).json({ error: 'No free table for this time any more.' });
      return res.json(store.update(id, { status, tableId: table.id }));
    }
    res.json(store.update(id, { status }));
  });
  app.use('/api/admin', admin);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return { app, store };
}
