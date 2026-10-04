import fs from 'node:fs';
import path from 'node:path';

/** Tiny JSON-file repository for reservations with atomic writes. */
export class ReservationStore {
  constructor(file) {
    this.file = file;
    this.data = { nextId: 1, reservations: [] };
    if (file && fs.existsSync(file)) {
      try { this.data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.warn(`[store] ${e.message} – starting empty`); }
    }
  }

  all() { return this.data.reservations; }
  get(id) { return this.data.reservations.find((r) => r.id === id) || null; }
  byCode(code) { return this.data.reservations.find((r) => r.code === code) || null; }

  create(fields) {
    const now = new Date().toISOString();
    const id = this.data.nextId++;
    const code = `TB-${String(id).padStart(4, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const reservation = { id, code, status: 'confirmed', ...fields, createdAt: now, updatedAt: now };
    this.data.reservations.push(reservation);
    this.save();
    return reservation;
  }

  update(id, patch) {
    const r = this.get(id);
    if (!r) return null;
    Object.assign(r, patch, { updatedAt: new Date().toISOString() });
    this.save();
    return r;
  }

  save() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }
}
