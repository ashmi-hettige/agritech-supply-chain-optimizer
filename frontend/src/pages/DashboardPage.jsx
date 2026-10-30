/**
 * First page after login. Farmers and admins get their own dashboards; others see a greeting and shortcuts.
 * @author Ashmi Hettige
 */
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { QUICK_ACTIONS, ROLE_LABELS } from '../constants/navigation';
import { ArrowRightIcon } from '../components/Icons';
import FarmerDashboard from './FarmerDashboard';
import AdminDashboard from './admin/AdminDashboard';

const INTRO = {
  BUYER: 'Find fresh produce from farms across Sri Lanka and track every order.',
  TRANSPORTER: 'Register your vehicles and follow the trips planned for you.',
  ADMIN: 'Manage crops, centres and daily prices, and plan delivery trips.',
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (user.role === 'FARMER') {
    return <FarmerDashboard user={user} />;
  }
  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} />;
  }

  const firstName = user.fullName.split(' ')[0];
  const actions = QUICK_ACTIONS[user.role] ?? [];

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <p className="eyebrow">{ROLE_LABELS[user.role]} dashboard</p>
      <h1 id="dashboard-title" style={{ marginTop: 'var(--space-2)' }}>
        {greeting()}, {firstName}
      </h1>
      <p className="text-muted" style={{ marginTop: 'var(--space-2)', maxWidth: 620 }}>
        {INTRO[user.role]}
      </p>

      <div className="quick-actions">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="quick-action card">
            <strong>{action.title}</strong>
            <span className="text-muted">{action.text}</span>
            <span className="quick-action-arrow"><ArrowRightIcon size={18} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}