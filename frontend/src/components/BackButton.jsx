/**
 * Round back-arrow button. The label is read out by screen readers, so the arrow needs no text.
 * With `to` it goes to that page; without it, it goes back one page (or home if there is no page to go back to).
 * @author Ashmi Hettige
 */
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';

export default function BackButton({ to, label }) {
  const navigate = useNavigate();

  if (to) {
    return (
      <Link to={to} className="back-button" aria-label={label} title={label}>
        <ArrowLeftIcon size={20} />
      </Link>
    );
  }

  function goBack() {
    // React Router counts pages opened in this tab; idx 0 means this is the first one
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/');
  }

  return (
    <button type="button" className="back-button" aria-label={label} title={label} onClick={goBack}>
      <ArrowLeftIcon size={20} />
    </button>
  );
}
