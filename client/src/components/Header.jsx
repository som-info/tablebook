import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="header">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="container header-inner">
        <Link to="/" className="brand"><Logo /> Ember &amp; Olive</Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="site-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <nav id="site-nav" className={`nav${open ? ' open' : ''}`} aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/admin">Bookings</NavLink>
          <Link to="/reserve" className="btn btn-sm">Book a table</Link>
        </nav>
      </div>
    </header>
  );
}
