'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  dismissToast,
  getServerToasts,
  getToasts,
  hydrateToastFlash,
  subscribeToasts,
  type ToastMessage,
  type ToastTone,
} from '../lib/toast-store';

const AUTO_DISMISS_MS = 5_000;

const TONE_LABEL: Record<ToastTone, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Notice',
};

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  useEffect(() => {
    hydrateToastFlash();
  }, []);

  return (
    <div className="toast-region" role="region" aria-label="Notifications" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      dismissToast(toast.id);
    }, AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast.id]);

  return (
    <div
      className={`toast toast-${toast.tone}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
    >
      <p>
        <span className="sr-only">{TONE_LABEL[toast.tone]}: </span>
        {toast.message}
      </p>
      <button
        type="button"
        className="toast-dismiss"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
