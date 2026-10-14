'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Anchor, Bell, BookOpen, ChevronLeft, ChevronRight, Globe, LayoutDashboard, LogOut, Menu, Settings, ShieldAlert, Ship, UserRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ParolaLogo } from '@/components/ui/ParolaLogo';
import { getBaseFontSize } from '@/utils/fontScale';
import { DASHBOARD_COPY } from './dashboard-copy';
import SideDrawer from './SideDrawer';
import { useWorkspaceViewport } from './use-workspace-viewport';
import { isVerifiedUpdate } from '@/lib/updates';
import { APPLICATION_COPY } from '../application/application-copy';
import styles from './dashboard.module.css';

export default function DashboardShell({ children, collapsed, toggleSidebar, contentMode = 'workspace' }: {
  children: ReactNode; collapsed: boolean; toggleSidebar: () => void; contentMode?: 'workspace' | 'scroll';
}) {
  const { language, changeLanguage, fontScale, logout, notifications, userProfile } = useApp();
  const copy = DASHBOARD_COPY[language];
  const pathname = usePathname();
  const viewport = useWorkspaceViewport();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const unread = notifications.filter(item => isVerifiedUpdate(item) && !item.read).length;
  const title = pathname === '/alerts' ? copy.advisories : pathname === '/notifications' ? copy.updates : pathname === '/settings' ? copy.settings : pathname === '/resources/guide' ? APPLICATION_COPY[language].guideTitle : pathname === '/resources/pricing' ? copy.pricing : pathname === '/resources/about' ? copy.about : pathname === '/resources' ? copy.resources : copy.dashboard;
  const navigation = [
    { href: '/dashboard', label: copy.dashboard, icon: LayoutDashboard },
    { href: '/alerts', label: copy.advisories, icon: ShieldAlert },
    { href: '/notifications', label: copy.updates, icon: Bell },
    { href: '/settings', label: copy.settings, icon: Settings },
  ];
  const resources = [
    { href: '/resources/guide', label: copy.openGuide, icon: BookOpen },
    { href: '/resources/pricing', label: copy.pricing, icon: Ship },
    { href: '/resources/about', label: copy.about, icon: Anchor },
  ];
  const sidebarLinks = (items: typeof navigation) => items.map(({ href, label, icon: Icon }) =>
    <Link key={href} href={href} title={label} aria-label={label} aria-current={pathname === href ? 'page' : undefined}
      className={styles.navLink} onClick={() => setNavigationOpen(false)}>
      <Icon size={20} aria-hidden="true" /><span className={styles.navLabel}>{label}</span>
      {href === '/notifications' && unread > 0 && <span className={styles.unread}>{unread}</span>}
    </Link>);
  const sidebarContents = <>
    <nav className={styles.primaryNav} aria-label={copy.navigation}>{sidebarLinks(navigation)}</nav>
    <nav className={styles.resourceNav} aria-label={copy.resources}><p className={styles.navLabel}>{copy.resources}</p>{sidebarLinks(resources)}</nav>
    <div className={styles.sidebarBottom}>
      <Link href="/profile" title={copy.profile} aria-label={copy.profile} className={styles.navLink}><UserRound size={20} aria-hidden="true" /><span className={styles.navLabel}>{copy.profile}</span></Link>
      <button type="button" className={styles.navLink} title={copy.logout} aria-label={copy.logout} onClick={logout}><LogOut size={20} aria-hidden="true" /><span className={styles.navLabel}>{copy.logout}</span></button>
      {viewport === 'desktop' && <button type="button" className={`${styles.navLink} ${styles.sidebarToggle}`} aria-label={collapsed ? copy.expandNav : copy.collapseNav} title={collapsed ? copy.expandNav : copy.collapseNav} onClick={toggleSidebar}>
        {collapsed ? <ChevronRight size={20} aria-hidden="true" /> : <ChevronLeft size={20} aria-hidden="true" />}<span className={styles.navLabel}>{copy.collapseNav}</span>
      </button>}
    </div>
  </>;
  return <div className={styles.shell} data-collapsed={collapsed} style={{ fontSize: getBaseFontSize(fontScale) }} lang={language === 'tl' ? 'fil' : language}>
    <a className={styles.skipLink} href="#dashboard-content">{copy.skip}</a>
    <aside className={styles.sidebar} aria-label={copy.navigation}>
      <div className={styles.sidebarBrand}><Link href="/dashboard" aria-label="Parola"><ParolaLogo className="w-8 h-8" iconOnly={collapsed || viewport !== 'desktop'} /></Link></div>
      <div className={styles.sidebarContent}>{sidebarContents}</div>
    </aside>
    <div className={styles.mainFrame}>
      <header className={styles.header}>
        {viewport === 'mobile' && <button type="button" className={styles.iconButton} aria-label={copy.navigation} aria-expanded={navigationOpen} onClick={() => setNavigationOpen(true)}><Menu size={21} aria-hidden="true" /></button>}
        <div className={styles.headerIdentity}><h1>{title}</h1><p title={userProfile.port}><Anchor size={14} aria-hidden="true" /><span>{userProfile.port || copy.portMissing}</span></p></div>
        <div className={styles.headerActions}>
          <Link href="/onboarding?from=profile" className={styles.changePort} title={copy.changePort} aria-label={copy.changePort}><Anchor size={16} aria-hidden="true" /><span>{copy.changePort}</span></Link>
          <label className={styles.language}><Globe size={16} aria-hidden="true" /><span className={styles.srOnly}>{copy.language}</span>
            <select value={language} onChange={event => changeLanguage(event.target.value as typeof language)}><option value="en">English</option><option value="tl">Tagalog</option><option value="ceb">Cebuano</option><option value="hil">Hiligaynon</option></select>
          </label>
        </div>
      </header>
      <main id="dashboard-content" tabIndex={-1} className={styles.content} data-mode={contentMode}>{children}</main>
    </div>
    {viewport === 'mobile' && <SideDrawer open={navigationOpen} close={() => setNavigationOpen(false)} title={copy.navigation} closeLabel={copy.close} side="left">
      <div className={styles.mobileSidebar}><div className={styles.drawerBrand}><ParolaLogo className="w-8 h-8" /></div><div className={styles.sidebarContent}>{sidebarContents}</div></div>
    </SideDrawer>}
  </div>;
}
