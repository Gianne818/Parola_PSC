'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './dashboard.module.css';

export default function SideDrawer({ open, close, title, closeLabel, side = 'right', children }: {
  open: boolean; close: () => void; title: string; closeLabel: string; side?: 'left' | 'right'; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className={styles.drawer} data-side={side} aria-label={title}
    onCancel={event => { event.preventDefault(); close(); }} onClose={close}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className={styles.drawerBody}>
      <div className={styles.drawerHeader}><span>{title}</span><button className={styles.iconButton} type="button" aria-label={closeLabel} onClick={close}><X size={20} aria-hidden="true" /></button></div>
      {children}
    </div>
  </dialog>;
}
