/**
 * A labelled input or select that shows its error message underneath.
 * @author Ashmi Hettige
 */
export default function FormField({ id, label, error, hint, as: Control = 'input', children, ...props }) {
  let describedBy;
  if (error) {
    describedBy = `${id}-error`;
  } else if (hint) {
    describedBy = `${id}-hint`;
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        name={id}
        className={`input ${error ? 'input-invalid' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </Control>
      {hint && !error && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}