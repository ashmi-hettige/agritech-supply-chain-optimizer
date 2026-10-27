/**
 * Page number buttons with Previous and Next. Pages are 0-based, like Spring's Pageable.
 * @author Ashmi Hettige
 */
function pageWindow(current, total) {
  // show at most 5 numbers around the current page
  const start = Math.max(0, Math.min(current - 2, total - 5));
  const end = Math.min(total, start + 5);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Pages">
      <button type="button" className="page-step" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {pageWindow(page, totalPages).map((number) => (
        <button
          key={number}
          type="button"
          className={`page-number ${number === page ? 'current' : ''}`}
          aria-current={number === page ? 'page' : undefined}
          aria-label={`Page ${number + 1}`}
          onClick={() => onChange(number)}
        >
          {number + 1}
        </button>
      ))}
      <button type="button" className="page-step" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}