import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="section page center">
      <div className="container">
        <p className="big-404">404</p>
        <h1>This table doesn't exist</h1>
        <p className="muted">The page you are looking for could not be found.</p>
        <Link to="/" className="btn">Back to home</Link>
      </div>
    </section>
  );
}
