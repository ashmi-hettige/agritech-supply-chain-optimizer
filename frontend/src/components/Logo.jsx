/**
 * GoviRoute leaf-and-route mark with the wordmark.
 * @author Ashmi Hettige
 */
export default function Logo({ size = 36, onDark = true }) {
  const ink = onDark ? 'var(--forest)' : 'var(--forest-ink)';

  return (
    <span className={`logo ${onDark ? 'logo-on-dark' : ''}`}>
      <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
        <path d="M5 31 C5 16 14 5 31 5 C31 22 20 31 5 31 Z" fill="var(--lime)" />
        <path
          d="M9 27 C14 22 18 18 24 12"
          fill="none"
          stroke={ink}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="3 3.2"
        />
        <circle cx="25.5" cy="10.5" r="2.8" fill={ink} />
      </svg>
      <span className="logo-text" style={{ fontSize: Math.round(size * 0.66) }}>
        Govi<span className="logo-accent">Route</span>
      </span>
    </span>
  );
}