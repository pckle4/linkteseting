import React from 'react';
import { createPortal } from 'react-dom';

// We'll implement a simple portal based toast system if needed, 
// but for this app structure, we might just keep the container as a placeholder 
// if strict toast management isn't implemented in the logic provided.
// However, to prevent errors, we provide a valid React component.

interface ToastProps {
  toasts: Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-slide-up flex items-center gap-2 min-w-[200px]"
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button 
            onClick={() => onRemove(toast.id)}
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};