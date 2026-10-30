/**
 * Shown for any URL that does not match a route.
 * @author Ashmi Hettige
 */
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFoundPage() {
  return (
    <main className="container" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: 'var(--space-4)', justifyItems: 'center' }}>
        <Logo size={48} onDark={false} />
        <h1>Page not found</h1>
        <p className="text-muted">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </main>
  );
}