import React, { useEffect, useRef } from 'react';
export function ConfirmDialog({ open, title, description, confirmLabel='Confirmar', cancelLabel='Cancelar', tone='danger', busy=false, onConfirm, onCancel }) {
  const cancelRef=useRef(null), previousRef=useRef(null);
  useEffect(()=>{
    if(!open) return undefined;
    previousRef.current=document.activeElement;
    requestAnimationFrame(()=>cancelRef.current?.focus());
    const onKey=(event)=>{if(event.key==='Escape'&&!busy)onCancel?.();};
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);requestAnimationFrame(()=>previousRef.current?.focus?.());};
  },[open,busy,onCancel]);
  if(!open) return null;
  return <div className="confirm-overlay" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget&&!busy)onCancel?.();}}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
      <span className={`confirm-marker ${tone}`} aria-hidden="true">!</span>
      <div><small>CONFIRMAÇÃO NECESSÁRIA</small><h2 id="confirm-title">{title}</h2><p id="confirm-description">{description}</p></div>
      <footer><button ref={cancelRef} type="button" className="confirm-cancel" disabled={busy} onClick={onCancel}>{cancelLabel}</button><button type="button" className={`confirm-action ${tone}`} disabled={busy} onClick={onConfirm}>{busy?'Processando...':confirmLabel}</button></footer>
    </section>
  </div>;
}
