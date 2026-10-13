"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { ParolaLogo } from "@/components/ui/ParolaLogo";
import { useInformationMotion } from "./useInformationMotion";
import styles from "./information.module.css";

const navigation = [
  { href: "/guide", label: "System Guide", page: "guide" },
  { href: "/pricing", label: "Pricing", page: "pricing" },
  { href: "/about", label: "About", page: "about" },
] as const;

export function InformationShell({
  page,
  children,
}: {
  page: "guide" | "pricing" | "about";
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useInformationMotion(root, page);
  return (
    <div
      ref={root}
      className={`${styles.page} font-sans antialiased`}
      data-information-page={page}
    >
      <a href={`#${page}-main`} className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className="flex items-center justify-between gap-3 h-[68px] px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Parola home"
          >
            <ParolaLogo
              iconOnly
              className="w-8 h-8 group-hover:scale-105 transition-transform"
            />
            <span className="font-display text-xl font-black tracking-tight text-[#12211E] uppercase">
              Parola
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-bold uppercase tracking-wider text-[#12211E]/75"
          >
            <Link
              href="/#how-it-works"
              className="hover:text-[#087F5B] transition-colors"
            >
              Features
            </Link>
            {navigation.map((item) => (
              <Link
                key={item.page}
                href={item.href}
                aria-current={page === item.page ? "page" : undefined}
                className={
                  page === item.page
                    ? styles.activeLink
                    : "hover:text-[#087F5B] transition-colors"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="inline-flex items-center min-h-11 text-xs font-bold uppercase tracking-wider text-[#12211E]/75 hover:text-[#12211E] transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center min-h-11 bg-[#087F5B] hover:bg-[#066B4C] text-white px-3 sm:px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
            >
              Register Vessel
            </Link>
          </div>
        </div>
        <nav aria-label="Mobile navigation" className={styles.mobileNav}>
          {navigation.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              aria-current={page === item.page ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" className={styles.logo}>
            <ParolaLogo iconOnly className="w-7 h-7" />
            <span>Parola</span>
          </Link>
          <p>For Philippine coastal communities.</p>
          <nav aria-label="Footer navigation">
            {navigation.map((item) => (
              <Link
                key={item.page}
                href={item.href}
                aria-current={page === item.page ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
