"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export function findScroller(element: HTMLElement): HTMLElement | undefined {
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (
      /(auto|scroll)/.test(getComputedStyle(parent).overflowY) &&
      parent.scrollHeight > parent.clientHeight + 1
    )
      return parent;
    parent = parent.parentElement;
  }
}

export const allowsMotion = () =>
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useInformationMotion(
  root: RefObject<HTMLDivElement | null>,
  page: string,
) {
  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const header = element.querySelector<HTMLElement>(":scope > header");
      const sectionNav = element.querySelector<HTMLElement>(
        'nav[aria-label="Pricing sections"]',
      );
      const journey = element.querySelector<HTMLElement>("[data-journey]");
      const nodes = Array.from(
        element.querySelectorAll<HTMLElement>("[data-journey-node]"),
      );
      const properties = [
        "--info-nav-top",
        "--info-anchor-offset",
        "--guide-sticky-top",
      ];
      const originalProperties = properties.map((property) =>
        element.style.getPropertyValue(property),
      );
      const measureLayout = () => {
        if (header && getComputedStyle(header).display !== "none") {
          const height = header.offsetHeight;
          element.style.setProperty("--info-nav-top", `${height}px`);
          element.style.setProperty(
            "--info-anchor-offset",
            `${height + (sectionNav?.offsetHeight ?? 0) + 24}px`,
          );
          element.style.setProperty("--guide-sticky-top", `${height + 24}px`);
        }
        if (journey && nodes.length) {
          const rail = journey.querySelector<HTMLElement>(
            "[data-journey-rail]",
          );
          const centers = nodes.map((node) => {
            const icon = node.firstElementChild as HTMLElement;
            return {
              x: node.offsetLeft + icon.offsetLeft + icon.offsetWidth / 2,
              y: node.offsetTop + icon.offsetTop + icon.offsetHeight / 2,
            };
          });
          if (rail) {
            const first = centers[0],
              last = centers[centers.length - 1];
            const horizontal =
              Math.abs(last.x - first.x) > Math.abs(last.y - first.y);
            Object.assign(rail.style, {
              left: `${first.x}px`,
              top: `${first.y}px`,
              right: "auto",
              bottom: "auto",
              width: horizontal ? `${last.x - first.x}px` : "2px",
              height: horizontal ? "2px" : `${last.y - first.y}px`,
              transformOrigin: horizontal ? "left" : "top",
            });
          }
        }
      };
      measureLayout();
      let mounted = true;
      const layoutObserver = new ResizeObserver(() => {
        measureLayout();
        ScrollTrigger.refresh();
      });
      [header, sectionNav, journey, ...nodes].forEach((target) => {
        if (target) layoutObserver.observe(target);
      });
      void document.fonts.ready.then(() => {
        if (mounted) measureLayout();
      });
      const media = gsap.matchMedia();
      media.add(
        {
          wide: "(min-width: 768px)",
          narrow: "(max-width: 767px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduce) {
            const controls = element.querySelectorAll(
              "[data-entry], [data-progress-fill], [data-guide-reward], [data-confetti], [data-complete-check], [data-badge-check], [data-disclosure-body], dialog[open]",
            );
            gsap
              .getTweensOf(controls)
              .forEach((tween) => tween.progress(1).kill());
            return;
          }
          let alive = true;
          const scope = gsap.context(() => {}, element);
          const scroller = findScroller(element);
          const refresh = () => ScrollTrigger.refresh();
          const imageElements = Array.from(element.querySelectorAll("img"));
          imageElements.forEach((image) =>
            image.addEventListener("load", refresh),
          );
          let measuredWidth = element.clientWidth;
          const resize = new ResizeObserver(() => {
            if (element.clientWidth !== measuredWidth) {
              measuredWidth = element.clientWidth;
              refresh();
            }
          });
          resize.observe(element);
          void document.fonts.ready.then(() => {
            if (!alive) return;
            scope.add(() => {
              const select = gsap.utils.selector(element);
              if (page === "about") {
                const headline = element.querySelector("h1");
                if (headline) {
                  let first = true;
                  SplitText.create(headline, {
                    type: "lines",
                    mask: "lines",
                    autoSplit: true,
                    aria: "auto",
                    onSplit: (split) => {
                      if (!first) {
                        gsap.set(split.lines, { yPercent: 0 });
                        return;
                      }
                      first = false;
                      return gsap.fromTo(
                        split.lines,
                        { yPercent: 105 },
                        {
                          yPercent: 0,
                          duration: 0.58,
                          stagger: 0.06,
                          ease: "power3.out",
                        },
                      );
                    },
                  });
                }
              }
              gsap.fromTo(
                select("[data-entry]"),
                { y: page === "guide" ? 16 : 12, opacity: 0.45 },
                {
                  y: 0,
                  opacity: 1,
                  duration:
                    page === "guide" ? 0.55 : page === "about" ? 0.7 : 0.6,
                  stagger: 0.06,
                  ease: "power3.out",
                },
              );
              element
                .querySelectorAll<HTMLElement>("[data-reveal-group]")
                .forEach((group) => {
                  const items = Array.from(
                    group.querySelectorAll("[data-reveal]"),
                  );
                  const targets = items.length ? items : [group];
                  gsap.fromTo(
                    targets,
                    { y: 12, opacity: 0.35 },
                    {
                      y: 0,
                      opacity: 1,
                      duration: group.hasAttribute("data-comparison")
                        ? 0.45
                        : 0.4,
                      stagger: group.hasAttribute("data-comparison")
                        ? 0.07
                        : 0.06,
                      ease: "power2.out",
                      scrollTrigger: {
                        trigger: group,
                        scroller,
                        start: "top 91%",
                        once: true,
                      },
                    },
                  );
                });
              const journey = element.querySelector("[data-journey]");
              if (journey) {
                const nodes = journey.querySelectorAll("[data-journey-node]");
                const rail = journey.querySelector("[data-journey-rail]");
                const horizontal = () =>
                  rail instanceof HTMLElement &&
                  rail.offsetWidth > rail.offsetHeight;
                const timeline = gsap.timeline({
                  scrollTrigger: {
                    trigger: journey,
                    scroller,
                    start: "top 85%",
                    once: true,
                    invalidateOnRefresh: true,
                  },
                });
                timeline.fromTo(
                  rail,
                  {
                    scaleX: () => (horizontal() ? 0 : 1),
                    scaleY: () => (horizontal() ? 1 : 0),
                  },
                  { scaleX: 1, scaleY: 1, duration: 1, ease: "power2.inOut" },
                  0,
                );
                timeline.fromTo(
                  nodes,
                  { y: 10, opacity: 0.35 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.4,
                    stagger: 0.17,
                    ease: "power2.out",
                  },
                  0.1,
                );
              }
              const closing = select("[data-closing]");
              if (closing.length)
                gsap.fromTo(
                  closing,
                  { y: 8, opacity: 0.5 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.35,
                    scrollTrigger: {
                      trigger: closing[0],
                      scroller,
                      start: "top 92%",
                      once: true,
                    },
                  },
                );
              refresh();
            });
          });
          return () => {
            alive = false;
            resize.disconnect();
            imageElements.forEach((image) =>
              image.removeEventListener("load", refresh),
            );
            scope.revert();
          };
        },
      );
      return () => {
        mounted = false;
        layoutObserver.disconnect();
        media.revert();
        properties.forEach((property, index) => {
          if (originalProperties[index])
            element.style.setProperty(property, originalProperties[index]);
          else element.style.removeProperty(property);
        });
      };
    },
    { scope: root, dependencies: [page], revertOnUpdate: true },
  );
}
