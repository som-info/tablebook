import { Link } from 'react-router-dom';

const highlights = [
  { icon: '🔥', title: 'Wood-fired', text: 'Breads, pizzas and meats cooked over oak and olive wood.' },
  { icon: '🌿', title: 'Seasonal produce', text: 'A short menu that changes with what local growers bring in.' },
  { icon: '🍷', title: 'Relaxed evenings', text: 'Tables for two, family dinners and groups of up to eight.' },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Mediterranean kitchen · Since 2018</p>
            <h1>Fire, olive oil &amp; good company.</h1>
            <p className="hero-text">Seasonal Mediterranean plates cooked over open flame. Check the menu, pick a time that suits you and book your table in under a minute.</p>
            <div className="hero-actions">
              <Link to="/reserve" className="btn">Book a table</Link>
              <Link to="/menu" className="btn btn-outline">View the menu</Link>
            </div>
            <ul className="hero-facts">
              <li><strong>Tue–Sun</strong><span>Lunch &amp; dinner</span></li>
              <li><strong>1–8</strong><span>Guests online</span></li>
              <li><strong>Instant</strong><span>Confirmation</span></li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="plate">
              <div className="plate-inner">
                <span className="leaf l1" /><span className="leaf l2" /><span className="leaf l3" />
                <span className="tomato t1" /><span className="tomato t2" /><span className="cheese" />
              </div>
            </div>
            <div className="hero-card">
              <p className="hero-card-title">Tonight</p>
              <p>Grilled sea bass, saffron potatoes &amp; salsa verde</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why guests come back</h2>
          <div className="cards-3">
            {highlights.map((h) => (
              <article className="card" key={h.title}>
                <span className="card-icon" aria-hidden="true">{h.icon}</span>
                <h3>{h.title}</h3>
                <p>{h.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container cta-inner">
          <div>
            <h2>Planning a dinner?</h2>
            <p>See live availability for your party size and reserve instantly.</p>
          </div>
          <Link to="/reserve" className="btn btn-light">Check availability</Link>
        </div>
      </section>
    </>
  );
}
