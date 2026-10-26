/**
 * First page after login. Greets the user; role-specific panels are added on later days.
 * @author Ashmi Hettige
 */
import useAuth from '../hooks/useAuth';
import { ROLE_LABELS } from '../constants/navigation';

const INTRO = {
  FARMER: 'List your harvest, check today\'s prices and see where you will earn the most.',
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
  const firstName = user.fullName.split(' ')[0];

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <p className="eyebrow">{ROLE_LABELS[user.role]} dashboard</p>
      <h1 id="dashboard-title" style={{ marginTop: 'var(--space-2)' }}>
        {greeting()}, {firstName}
      </h1>
      <p className="text-muted" style={{ marginTop: 'var(--space-2)', maxWidth: 620 }}>
        {INTRO[user.role]}
      </p>
    </section>
  );
}