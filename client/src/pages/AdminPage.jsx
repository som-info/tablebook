import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDate, formatTime, toISODate } from '../utils.js';

const STATUSES = ['confirmed', 'seated', 'completed', 'cancelled', 'no-show'];
const KEY = 'tablebook:admin-key';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY) || '');
  const [keyInput, setKeyInput] = useState('');
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({ date: '', status: '', q: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    try {
      setList(await api(`/admin/reservations${qs ? `?${qs}` : ''}`, { adminKey }));
      setError('');
    } catch (e) {
      if (e.status === 401) { sessionStorage.removeItem(KEY); setAdminKey(''); }
      setError(e.message);
    } finally { setLoading(false); }
  }, [adminKey, filters]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id, status) {
    try {
      const updated = await api(`/admin/reservations/${id}`, { method: 'PATCH', body: { status }, adminKey });
      setList((l) => l.map((r) => (r.id === id ? updated : r)));
    } catch (e) { setError(e.message); }
  }

  if (!adminKey) {
    return (
      <section className="section page">
        <div className="container narrow">
          <form className="card login" onSubmit={(e) => { e.preventDefault(); sessionStorage.setItem(KEY, keyInput); setAdminKey(keyInput); }}>
            <h1>Bookings admin</h1>
            <p className="muted">Enter the admin key configured on the server (<code>ADMIN_KEY</code>). In development the demo key is <code>admin-demo</code>.</p>
            {error && <p className="alert error" role="alert">{error}</p>}
            <div className="field">
              <label htmlFor="key">Admin key</label>
              <input id="key" type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} autoComplete="current-password" required />
            </div>
            <button className="btn" type="submit" disabled={!keyInput}>Sign in</button>
          </form>
        </div>
      </section>
    );
  }

  const active = list.filter((r) => r.status !== 'cancelled');
  const todayISO = toISODate(new Date());
  const stats = [
    { label: 'Bookings', value: active.length },
    { label: 'Guests', value: active.reduce((n, r) => n + r.partySize, 0) },
    { label: 'Today', value: active.filter((r) => r.date === todayISO).length },
    { label: 'Cancelled', value: list.length - active.length },
  ];

  return (
    <section className="section page">
      <div className="container">
        <header className="page-head admin-head">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Reservations</h1>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => { sessionStorage.removeItem(KEY); setAdminKey(''); setList([]); }}>Sign out</button>
        </header>

        <div className="stats">
          {stats.map((s) => <div className="stat card" key={s.label}><span>{s.value}</span>{s.label}</div>)}
        </div>

        <div className="filters card">
          <div className="field"><label htmlFor="f-date">Date</label>
            <input id="f-date" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} /></div>
          <div className="field"><label htmlFor="f-status">Status</label>
            <select id="f-status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div className="field grow"><label htmlFor="f-q">Search</label>
            <input id="f-q" type="search" placeholder="Name, email, phone or reference" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></div>
          <button className="btn btn-outline btn-sm" onClick={() => setFilters({ date: '', status: '', q: '' })}>Reset</button>
        </div>

        {error && <p className="alert error" role="alert">{error}</p>}
        {loading && !list.length ? <p className="muted">Loading…</p> : list.length === 0 ? (
          <p className="muted empty">No reservations match these filters.</p>
        ) : (
          <div className="table-wrap card">
            <table className="bookings">
              <thead>
                <tr><th>Date &amp; time</th><th>Guest</th><th>Contact</th><th>Party</th><th>Table</th><th>Notes</th><th>Status</th></tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className={`st-${r.status}`}>
                    <td data-label="When"><strong>{formatDate(r.date, { weekday: 'short', month: 'short', day: 'numeric' })}</strong><br />{formatTime(r.time)}</td>
                    <td data-label="Guest">{r.name}<br /><span className="muted small code">{r.code}</span></td>
                    <td data-label="Contact"><a href={`mailto:${r.email}`}>{r.email}</a><br /><span className="small">{r.phone}</span></td>
                    <td data-label="Party">{r.partySize}</td>
                    <td data-label="Table">{r.tableId}</td>
                    <td data-label="Notes" className="notes">{r.notes || <span className="muted">—</span>}</td>
                    <td data-label="Status">
                      <label className="sr-only" htmlFor={`st-${r.id}`}>Status for {r.name}</label>
                      <select id={`st-${r.id}`} className={`status-select ${r.status}`} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
