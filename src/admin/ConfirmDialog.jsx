import React, { useEffect, useRef } from 'react';
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'CONFIRMAR',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Tab') {
        const buttons = [...document.querySelectorAll('[data-confirm-dialog] button')];
        if (!buttons.length) return;
        const i = buttons.indexOf(document.activeElement),
          n = e.shiftKey
            ? i <= 0
              ? buttons.length - 1
              : i - 1
            : i === buttons.length - 1
              ? 0
              : i + 1;
        e.preventDefault();
        buttons[n].focus();
      }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div
      className="admin-dialog-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <section
        data-confirm-dialog
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        <footer>
          <button ref={cancelRef} type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={danger ? 'admin-danger' : 'admin-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
