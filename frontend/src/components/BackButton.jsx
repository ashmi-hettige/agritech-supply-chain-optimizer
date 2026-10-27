/**
 * Round back-arrow button. The label is read out by screen readers, so the arrow needs no text.
 * @author Ashmi Hettige
 */
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';

export default function BackButton({ to, label }) {
  return (
    <Link to={to} className="back-button" aria-label={label} title={label}>
      <ArrowLeftIcon size={20} />
    </Link>
  );
}