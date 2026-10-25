/**
 * Shows toast messages in the corner and removes each one after a few seconds.
 * @author Ashmi Hettige
 */
import { useCallback, useState } from 'react';
import { ToastContext } from './ToastContext';

const DISPLAY_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, DISPLAY_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* aria-live makes screen readers announce new messages */}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}