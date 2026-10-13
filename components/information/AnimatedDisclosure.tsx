"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { allowsMotion } from "./useInformationMotion";
import styles from "./information.module.css";

export function AnimatedDisclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const element = body.current;
      if (!element) return;
      gsap.to(element, {
        height: open ? element.scrollHeight : 0,
        duration: allowsMotion() ? 0.22 : 0,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          if (open) gsap.set(element, { height: "auto" });
          ScrollTrigger.refresh();
        },
      });
    },
    { scope: root, dependencies: [open] },
  );
  return (
    <div ref={root} className={styles.disclosure}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown size={16} className={open ? styles.rotated : ""} />
      </button>
      <div
        ref={body}
        id={id}
        className={styles.disclosureBody}
        data-disclosure-body
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.disclosureContent}>{children}</div>
      </div>
    </div>
  );
}
