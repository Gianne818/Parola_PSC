"use client";
import { useRef } from "react";
import Image from "next/image";
import { X, ExternalLink } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { allowsMotion } from "./useInformationMotion";
import styles from "./information.module.css";
export interface GuideImage {
  src: string;
  title: string;
  caption: string;
  alt: string;
}
export function ScreenshotDialog({
  image,
  onClose,
}: {
  image: GuideImage | null;
  onClose: () => void;
}) {
  const root = useRef<HTMLDialogElement>(null);
  useGSAP(
    (_context, contextSafe) => {
      const dialog = root.current;
      if (!dialog || !image || !contextSafe) return;
      const previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      gsap.fromTo(
        dialog,
        { opacity: 0, scale: 0.97 },
        {
          opacity: 1,
          scale: 1,
          duration: allowsMotion() ? 0.22 : 0,
          ease: "power2.out",
        },
      );
      let closing = false;
      const dismiss = contextSafe((event: Event) => {
        event.preventDefault();
        if (closing) return;
        closing = true;
        gsap.to(dialog, {
          opacity: 0,
          scale: 0.98,
          duration: allowsMotion() ? 0.16 : 0,
          overwrite: true,
          onComplete: () => {
            dialog.close();
            onClose();
          },
        });
      });
      const backdrop = contextSafe((event: MouseEvent) => {
        const bounds = dialog.getBoundingClientRect();
        if (
          event.target === dialog &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        )
          dismiss(event);
      });
      const closeButton = dialog.querySelector<HTMLButtonElement>(
        "[data-dialog-close]",
      );
      const containFocus = (event: KeyboardEvent) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href]",
          ),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      };
      closeButton?.addEventListener("click", dismiss);
      dialog.addEventListener("cancel", dismiss);
      dialog.addEventListener("click", backdrop);
      dialog.addEventListener("keydown", containFocus);
      return () => {
        closeButton?.removeEventListener("click", dismiss);
        dialog.removeEventListener("cancel", dismiss);
        dialog.removeEventListener("click", backdrop);
        dialog.removeEventListener("keydown", containFocus);
        dialog.close();
        if (previousFocus?.isConnected)
          previousFocus.focus({ preventScroll: true });
      };
    },
    { scope: root, dependencies: [image, onClose], revertOnUpdate: true },
  );
  return (
    <dialog
      ref={root}
      className={styles.dialog}
      aria-labelledby="screenshot-dialog-title"
      aria-describedby="screenshot-dialog-caption"
    >
      <div className={styles.dialogHeader}>
        <h2 id="screenshot-dialog-title">{image?.title}</h2>
        <button type="button" data-dialog-close aria-label="Close screenshot">
          <X size={20} />
        </button>
      </div>
      {image && (
        <>
          <div className={styles.dialogImage}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="94vw"
              className="object-contain"
            />
          </div>
          <div className={styles.dialogCaption}>
            <p id="screenshot-dialog-caption">{image.caption}</p>
            <a href={image.src} target="_blank" rel="noopener noreferrer">
              Open full image <ExternalLink size={13} className="inline" />
            </a>
          </div>
        </>
      )}
    </dialog>
  );
}
