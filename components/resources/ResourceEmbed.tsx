'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import styles from "./resource-embed.module.css";

export function ResourceEmbed({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const navigateResource = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a') : null;
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin || !['/guide', '/pricing', '/about'].includes(destination.pathname)) return;
    event.preventDefault();
    event.stopPropagation();
    router.push(`/resources${destination.pathname}${destination.search}${destination.hash}`);
  };
  return <div className={styles.embed} onClickCapture={navigateResource}>{children}</div>;
}
