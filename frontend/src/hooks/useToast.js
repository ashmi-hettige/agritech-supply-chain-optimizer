/**
 * Returns showToast(message, type) from the toast context.
 * @author Ashmi Hettige
 */
import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

export default function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return showToast;
}