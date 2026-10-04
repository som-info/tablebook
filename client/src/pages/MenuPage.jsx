import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { price } from '../utils.js';

const TAG_LABEL = { vegetarian: 'V', vegan: 'VG', 'gluten-free': 'GF' };

export default function MenuPage() {
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState('All');
  const [diet, setDiet] = useState('');

  useEffect(() => { api('/menu').then(setMenu).catch((e) => setError(e.message)); }, []);

  const categories = menu ? ['All', ...menu.map((c) => c.category)] : [];
  const visible = (menu || [])
    .filter((c) => active === 'All' || c.category === active)
    .map((c) => ({ ...c, items: c.items.filter((i) => !diet || i.tags?.includes(diet)) }))
    .filter((c) => c.items.length);

  return (
    <section className="section page">
      <div className="container">
        <header className="page-head">
          <p className="eyebrow">Our menu</p>
          <h1>Seasonal, simple, cooked over fire</h1>
          <p className="muted">V = vegetarian · VG = vegan · GF = gluten-free. Please tell us about allergies when booking.</p>
        </header>

        {error && <p className="alert error" role="alert">{error}</p>}
        {!menu && !error && <p className="muted">Loading menu…</p>}

        {menu && (
          <>
            <div className="menu-toolbar">
              <div className="chips" role="tablist" aria-label="Menu categories">
                {categories.map((c) => (
                  <button key={c} role="tab" aria-selected={active === c} className={`chip${active === c ? ' active' : ''}`} onClick={() => setActive(c)}>{c}</button>
                ))}
              </div>
              <label className="diet-filter">
                <span>Dietary</span>
                <select value={diet} onChange={(e) => setDiet(e.target.value)}>
                  <option value="">Everything</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten-free">Gluten-free</option>
                </select>
              </label>
            </div>

            {visible.length === 0 && <p className="muted">No dishes match this filter.</p>}
            <div className="menu-grid">
              {visible.map((cat) => (
                <section key={cat.category} className="menu-section">
                  <h2>{cat.category}</h2>
                  <ul>
                    {cat.items.map((item) => (
                      <li key={item.name} className="menu-item">
                        <div className="menu-item-head">
                          <h3>{item.name}</h3>
                          <span className="dots" aria-hidden="true" />
                          <span className="price">{price(item.price)}</span>
                        </div>
                        <p>{item.description}</p>
                        {item.tags?.length > 0 && (
                          <p className="diet">{item.tags.map((t) => <abbr key={t} title={t}>{TAG_LABEL[t]}</abbr>)}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <p className="center"><Link to="/reserve" className="btn">Book a table</Link></p>
          </>
        )}
      </div>
    </section>
  );
}
