'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useApp } from '@/context/AppContext';
import { isVerifiedUpdate, newestUpdates, updateProvenance, updateTime } from '@/lib/updates';
import { displayTime } from '@/components/dashboard/Advisory';
import { DASHBOARD_COPY } from '@/components/dashboard/dashboard-copy';
import { APPLICATION_COPY, type ApplicationCopy } from '@/components/application/application-copy';
import type { AlertNotification, Language } from '@/types';
import styles from '@/components/application/application.module.css';

function categoryLabel(type: AlertNotification['type'], text: ApplicationCopy) { return text[type] || text.community; }
function provenanceLabel(item: AlertNotification, text: ApplicationCopy) {
  const provenance = updateProvenance(item);
  return provenance === 'verified' ? text.verified : provenance === 'sample' ? text.sampleMessage : text.unverified;
}

function UpdateRow({ item, text, language, selected, open }: { item: AlertNotification; text: ApplicationCopy; language: Language; selected: boolean; open: (id: string) => void }) {
  const time = displayTime(updateTime(item), language);
  return <button type="button" className={styles.row} data-update-id={item.id} data-unread={isVerifiedUpdate(item) && !item.read} aria-current={selected || undefined} onClick={() => open(item.id)}>
    <span className={styles.rowContent}>
      <span className={styles.rowTitle}>{item.title[language] || item.title.en}</span><span className={styles.rowPreview}>{item.message[language] || item.message.en}</span>
      <span className={styles.rowMeta}><span>{categoryLabel(item.type, text)}</span>{isVerifiedUpdate(item) ? <span className={!item.read ? styles.unread : undefined}>{item.read ? text.read : text.unread}</span> : <span>{provenanceLabel(item, text)}</span>}<span>{time ? `${time} PHT` : DASHBOARD_COPY[language].unknownTime}</span></span>
    </span><ChevronRight size={17} aria-hidden="true" />
  </button>;
}

export default function UpdatesPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, purgeNotifications, language } = useApp();
  const copy = DASHBOARD_COPY[language];
  const text = APPLICATION_COPY[language];
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(20);
  const [previousLimit, setPreviousLimit] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const toolbarRef = useRef<HTMLButtonElement>(null);
  const selected = notifications.find(item => item.id === selectedId);
  const verified = notifications.filter(isVerifiedUpdate);
  const unread = verified.filter(item => !item.read).length;
  const matches = (item: AlertNotification) => (category === 'all' || item.type === category)
    && `${item.title[language] || item.title.en} ${item.message[language] || item.message.en}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  const filtered = newestUpdates(verified.filter(item => (!unreadOnly || !item.read) && matches(item)));
  const previous = newestUpdates(notifications.filter(item => !isVerifiedUpdate(item) && matches(item)));
  const previousCount = notifications.filter(item => !isVerifiedUpdate(item)).length;
  const categories = useMemo(() => Array.from(new Set(notifications.map(item => item.type))), [notifications]);

  useEffect(() => { if (selectedId) headingRef.current?.focus(); }, [selectedId]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (confirmOpen && !dialog?.open) dialog?.showModal();
    if (!confirmOpen && dialog?.open) dialog.close();
  }, [confirmOpen]);
  const open = (id: string) => { setSelectedId(id); markNotificationRead(id); };
  const back = () => {
    const id = selectedId;
    setSelectedId(null);
    requestAnimationFrame(() => {
      const row = id ? document.querySelector<HTMLButtonElement>(`[data-update-id="${CSS.escape(id)}"]`) : null;
      (row || toolbarRef.current)?.focus();
    });
  };
  const reset = () => { setSearch(''); setCategory('all'); setUnreadOnly(false); setLimit(20); };
  return <AuthLayout variant="application">
    <div className={styles.page}>
      <div className={styles.inboxColumns} data-selected={Boolean(selected)} data-empty={!selected && filtered.length === 0}>
        <div className={styles.listColumn}>
          <div className={styles.inboxChrome}>
      <div className={styles.toolbar}>
        <label className={`${styles.field} ${styles.searchField}`}>{text.search}<input className={styles.input} type="search" value={search} onChange={event => { setSearch(event.target.value); setLimit(20); }} /></label>
        <label className={`${styles.field} ${styles.categoryField}`}>{text.category}<select className={styles.select} value={category} onChange={event => { setCategory(event.target.value); setLimit(20); }}><option value="all">{copy.all}</option>{categories.map(type => <option key={type} value={type}>{categoryLabel(type, text)}</option>)}</select></label>
        <button className={styles.button} type="button" disabled={unread === 0} onClick={markAllNotificationsRead}>{text.markAll}</button>
        <details ref={menuRef} className={styles.menu} onKeyDown={event => { if (event.key === 'Escape' && menuRef.current) { menuRef.current.open = false; menuRef.current.querySelector('summary')?.focus(); } }}><summary className={styles.button} aria-label={text.moreActions}><MoreHorizontal size={20} aria-hidden="true" /></summary><div className={styles.menuPanel}><button type="button" className={styles.button} disabled={notifications.length === 0} onClick={() => { if (menuRef.current) menuRef.current.open = false; setConfirmOpen(true); }}><Trash2 size={16} aria-hidden="true" />{text.clearHistory}</button></div></details>
      </div>
          <div className={styles.inboxHeading}><div className={styles.tabs} aria-label={text.inbox}><button ref={toolbarRef} type="button" aria-pressed={!unreadOnly} onClick={() => { setUnreadOnly(false); setLimit(20); }}>{copy.all}</button><button type="button" aria-pressed={unreadOnly} onClick={() => { setUnreadOnly(true); setLimit(20); }}>{text.unread}{unread > 0 && ` (${unread})`}</button></div><span className={styles.small}>{text.localHistory}</span></div>
          </div>
          {filtered.length > 0 ? <><div className={styles.inbox}>{filtered.slice(0, limit).map(item => <UpdateRow key={item.id} item={item} text={text} language={language} selected={selectedId === item.id} open={open} />)}</div>{filtered.length > limit && <div className={styles.pagination}><button type="button" className={styles.button} onClick={() => setLimit(value => value + 20)}>{copy.showMore}</button></div>}</> : <section className={styles.empty} role="status"><h2>{search.trim() || category !== 'all' ? text.noMatches : unreadOnly && verified.length ? text.noUnread : text.noUpdates}</h2><p>{text.noUpdatesText}</p>{search.trim() || category !== 'all' || unreadOnly ? <button type="button" className={styles.link} onClick={reset}>{text.reset}</button> : <Link href="/alerts" className={styles.link}>{copy.readAdvisory}</Link>}</section>}
          {previousCount > 0 && <details className={`${styles.disclosure} ${styles.previous}`}><summary>{text.previous} ({previousCount})</summary><p>{text.previousText}</p>{previous.length ? <><div className={styles.inbox}>{previous.slice(0, previousLimit).map(item => <UpdateRow key={item.id} item={item} text={text} language={language} selected={selectedId === item.id} open={open} />)}</div>{previous.length > previousLimit && <div className={styles.actions}><button type="button" className={styles.button} onClick={() => setPreviousLimit(value => value + 20)}>{copy.showMore}</button></div>}</> : <p>{text.noMatches}</p>}</details>}
        </div>
        {(selected || filtered.length > 0) && <aside className={styles.detailPanel}>
          {selected ? <article className={styles.panel}><button type="button" className={styles.link} onClick={back}><ArrowLeft size={16} aria-hidden="true" />{text.backUpdates}</button><h2 ref={headingRef} tabIndex={-1}>{selected.title[language] || selected.title.en}</h2><p className={styles.message}>{selected.message[language] || selected.message.en}</p><dl className={styles.details}><div><dt>{text.category}</dt><dd>{categoryLabel(selected.type, text)}</dd></div><div><dt>{text.eventTime}</dt><dd>{displayTime(updateTime(selected), language) || copy.unknownTime}</dd></div>{selected.location && <div><dt>{text.location}</dt><dd>{selected.location}</dd></div>}<div><dt>{copy.source}</dt><dd>{provenanceLabel(selected, text)}</dd></div></dl>{isVerifiedUpdate(selected) && selected.type === 'weather' && <Link href="/alerts" className={styles.link}>{copy.readAdvisory}</Link>}</article> : <div className={styles.detailPlaceholder}>{text.selectUpdate}</div>}
        </aside>}
      </div>
      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="clear-history-title" aria-describedby="clear-history-description" onCancel={event => { event.preventDefault(); setConfirmOpen(false); }} onClose={() => { setConfirmOpen(false); menuRef.current?.querySelector('summary')?.focus(); }} onClick={event => { if (event.target === event.currentTarget) setConfirmOpen(false); }}><h2 id="clear-history-title">{text.clearHistory}</h2><p id="clear-history-description">{text.clearExplanation}</p><div className={styles.actions}><button type="button" className={styles.button} autoFocus onClick={() => setConfirmOpen(false)}>{text.cancel}</button><button type="button" className={styles.danger} onClick={() => { purgeNotifications(); setSelectedId(null); setConfirmOpen(false); }}>{text.clearHistory}</button></div></dialog>
    </div>
  </AuthLayout>;
}
