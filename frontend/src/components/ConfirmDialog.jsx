/**
 * "Are you sure?" pop-up built on the HTML <dialog> element, which handles focus and the Esc key.
 * @author Ashmi Hettige
 */
import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel = 'Cancel', busy, onConfirm, onCancel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event) {
    // Esc key: let React state close the dialog instead of the browser
    event.preventDefault();
    if (!busy) onCancel();
  }

  return (
    <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirm-title" onCancel={handleCancel}>
      <h2 id="confirm-title">{title}</h2>
      <p className="text-muted">{message}</p>
      <div className="confirm-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}