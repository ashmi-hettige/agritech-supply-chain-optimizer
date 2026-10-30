/**
 * Only lets logged-in users (and, optionally, certain roles) see the pages inside it.
 * @author Ashmi Hettige
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading" role="status">Loading…</div>;
  }
  if (!user) {
    // remember where the user was going, so login can send them back there
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}