import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
export function NotificationCenter({ compact = false }) {
  const [items, setItems] = useState([]),
    [open, setOpen] = useState(false),
    trigger = useRef(null),
    panel = useRef(null),
    panelId = useId();
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);
  useEffect(() => {
    let active = true;
    supabase
      .rpc('amex_my_notifications', { page_number: 1 })
      .then(({ data }) => active && setItems(data ?? []));
    return () => {
      active = false;
    };
  }, []);
  const unread = items.filter((x) => !x.read_at).length;
  async function read(id) {
    await supabase.rpc('amex_mark_notification_read', { target_id: id });
    setItems((x) => x.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  }
  return (
    <div className="notification-center">
      <button
        ref={trigger}
        type="button"
        aria-label={`Notificações, ${unread} não lidas`}
        onClick={() => setOpen((x) => !x)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`notification-trigger utility-item ${open ? 'active' : ''}`}
      >
        <svg className="notification-bell" viewBox="0 0 24 24" aria-hidden="true">
          <path className="notification-bell-body" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path className="notification-bell-clapper" d="M13.73 21a2 2 0 0 1-3.46 0" />
          <path className="notification-bell-highlight" d="M8.4 8.8c.15-1.48.96-2.55 2.25-3" />
        </svg>
        <span className={compact ? 'utility-label' : 'sr-only'}>Notificações</span>
        {unread > 0 && <b className="notification-count">{unread}</b>}
      </button>
      {open && createPortal(
        <div className="notification-layer">
          <button type="button" className="notification-backdrop" aria-label="Fechar notificações" onClick={() => { setOpen(false); trigger.current?.focus(); }} />
          <section ref={panel} id={panelId} className="notification-panel" role="dialog" aria-modal="true" aria-labelledby={`${panelId}-title`}>
            <header><div><small>CENTRAL</small><h2 id={`${panelId}-title`}>Notificações</h2></div><button type="button" aria-label="Fechar notificações" onClick={() => { setOpen(false); trigger.current?.focus(); }}>×</button></header>
            <div className="notification-list">
              {items.length ? items.map((n) => (
                <button type="button" className={n.read_at ? 'is-read' : 'is-unread'} key={n.id} onClick={() => read(n.id)}><strong>{n.title}</strong><span>{n.message}</span></button>
              )) : <p>Nenhuma notificação.</p>}
            </div>
          </section>
        </div>, document.body)}
    </div>
  );
}
