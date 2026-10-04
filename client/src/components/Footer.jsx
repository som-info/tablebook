import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">Ember &amp; Olive</p>
          <p>Wood-fired Mediterranean kitchen.<br />A demo restaurant for the Tablebook project.</p>
        </div>
        <div>
          <p className="footer-title">Opening hours</p>
          <p>Tue – Sun<br />Lunch 12:00 – 15:30<br />Dinner 18:00 – 23:00<br />Closed on Mondays</p>
        </div>
        <div>
          <p className="footer-title">Visit</p>
          <p>12 Example Street<br />Demo City</p>
          <Link to="/reserve">Reserve online →</Link>
        </div>
      </div>
      <p className="container copyright">© {new Date().getFullYear()} Tablebook demo · Built with React &amp; Express</p>
    </footer>
  );
}
