'use client';

import Link from 'next/link';
import { Anchor, ArrowRight, BookOpen, Radio, Ship, Waves, Wind } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useApp } from '@/context/AppContext';
import { RESOURCE_COPY } from '@/components/resources/resource-copy';
import styles from '@/components/resources/resources.module.css';

export default function ResourcesHubPage() {
  const { language } = useApp();
  const copy = RESOURCE_COPY[language];
  const destinations = [
    { href: '/resources/guide', icon: BookOpen, title: copy.guideTitle, description: copy.guideDescription },
    { href: '/resources/pricing', icon: Ship, title: copy.pricingTitle, description: copy.pricingDescription },
    { href: '/resources/about', icon: Anchor, title: copy.aboutTitle, description: copy.aboutDescription },
  ];
  const references = [
    { icon: Waves, label: copy.wave, value: '≥ 2 m' },
    { icon: Wind, label: copy.wind, value: '≥ 20 knots' },
    { icon: Radio, label: copy.emergency, value: 'VHF Ch 16' },
    { icon: Anchor, label: copy.dispatch, value: copy.onRequest },
  ];
  return <AuthLayout variant="application">
    <div className={styles.hub}>
      <p className={styles.intro}>{copy.intro}</p>
      <div className={styles.destinations}>
        {destinations.map(({ href, icon: Icon, title, description }) => <Link href={href} key={href} className={styles.destination}>
          <Icon size={24} aria-hidden="true" />
          <div><h2>{title}</h2><p>{description}</p></div>
          <span className={styles.open}>{copy.open}<ArrowRight size={18} aria-hidden="true" /></span>
        </Link>)}
      </div>
      <section className={styles.reference} aria-labelledby="quick-reference-heading">
        <h2 id="quick-reference-heading">{copy.reference}</h2>
        <p>{copy.referenceNote}</p>
        <dl>{references.map(({ icon: Icon, label, value }) => <div key={label}><dt><Icon size={18} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
    </div>
  </AuthLayout>;
}
