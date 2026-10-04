import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { localDate } from '../src/availability.js';

// Fixed clock: Tuesday 2026-10-06 10:00 local time.
const NOW = new Date(2026, 9, 6, 10, 0);
let server, base;
const ADMIN = { 'x-admin-key': 'secret', 'content-type': 'application/json' };

before(async () => {
  const { app } = createApp({ adminKey: 'secret', now: () => NOW });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

const get = (p, headers) => fetch(base + p, { headers }).then(async (r) => ({ status: r.status, body: await r.json() }));
const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json() }));
const booking = (over = {}) => ({ name: 'Jane Doe', email: 'jane@example.com', phone: '+1 555 123 4567', date: '2026-10-08', time: '19:00', partySize: 2, ...over });

test('menu has categories with items', async () => {
  const { body } = await get('/menu');
  assert.ok(body.length >= 3);
  assert.ok(body.every((c) => c.items.length));
});

test('availability rejects past dates, closed days and big parties', async () => {
  assert.match((await get('/availability?date=2026-10-01&partySize=2')).body.reason, /past/);
  assert.match((await get('/availability?date=2026-10-12&partySize=2')).body.reason, /closed on Mondays/);
  assert.match((await get('/availability?date=2026-10-08&partySize=12')).body.reason, /call us/);
  assert.match((await get('/availability?date=2027-03-01&partySize=2')).body.reason, /in advance/);
});

test('same-day slots respect the lead time', async () => {
  const { body } = await get(`/availability?date=${localDate(NOW)}&partySize=2`);
  assert.equal(body.slots.find((s) => s.time === '12:00').available, true);   // 10:00 + 60 min < 12:00
  const tight = createApp({ now: () => new Date(2026, 9, 6, 11, 45) });
  const srv = tight.app.listen(0); await new Promise((r) => srv.once('listening', r));
  const res = await fetch(`http://localhost:${srv.address().port}/api/availability?date=2026-10-06&partySize=2`).then((r) => r.json());
  srv.close();
  assert.equal(res.slots.find((s) => s.time === '12:00').available, false);
  assert.equal(res.slots.find((s) => s.time === '13:00').available, true);
});

test('validation errors are returned per field', async () => {
  const { status, body } = await post('/reservations', { name: 'J', email: 'nope', phone: 'abc', date: '2026-10-12', time: '03:00', partySize: 0 });
  assert.equal(status, 400);
  assert.deepEqual(Object.keys(body.details).sort(), ['date', 'email', 'name', 'partySize', 'phone', 'time']);
});

test('booking assigns the smallest fitting table and blocks it', async () => {
  const first = await post('/reservations', booking({ partySize: 8 }));
  assert.equal(first.status, 201);
  assert.equal(first.body.tableId, 'T11');
  assert.match(first.body.code, /^TB-\d{4}-/);
  assert.equal(first.body.email, undefined); // contact details not echoed

  // The only 8-seat table is busy for 90 minutes around 19:00.
  const day = (await get('/availability?date=2026-10-08&partySize=8')).body;
  const at = (t) => day.slots.find((s) => s.time === t).available;
  assert.equal(at('19:00'), false);
  assert.equal(at('18:00'), false);   // 18:00–19:30 overlaps
  assert.equal(day.slots.some((s) => s.time === '17:30'), false); // not a seating time
  assert.equal(at('20:30'), true);    // starts when the table is free again

  const clash = await post('/reservations', booking({ partySize: 7, time: '19:30' }));
  assert.equal(clash.status, 409);
});

test('admin endpoints need the key, list and update bookings', async () => {
  assert.equal((await get('/admin/reservations')).status, 401);
  const list = await get('/admin/reservations?date=2026-10-08', ADMIN);
  assert.equal(list.status, 200);
  assert.ok(list.body.length >= 1);
  const id = list.body[0].id;
  const patch = await fetch(`${base}/admin/reservations/${id}`, { method: 'PATCH', headers: ADMIN, body: JSON.stringify({ status: 'cancelled' }) });
  assert.equal((await patch.json()).status, 'cancelled');
  // Cancelled bookings free the table again.
  const day = (await get('/availability?date=2026-10-08&partySize=8')).body;
  assert.equal(day.slots.find((s) => s.time === '19:00').available, true);
  const bad = await fetch(`${base}/admin/reservations/${id}`, { method: 'PATCH', headers: ADMIN, body: JSON.stringify({ status: 'eaten' }) });
  assert.equal(bad.status, 400);
});
