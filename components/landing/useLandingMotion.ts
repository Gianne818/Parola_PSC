"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const motionAllowed = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useLandingMotion(selectedCommand: string, simulateGale: boolean) {
  const root = useRef<HTMLDivElement>(null);
  const previousCommand = useRef(selectedCommand);
  const previousSafety = useRef(simulateGale);
  const replyTimeline = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const media = gsap.matchMedia(root);
    media.add({
      desktop: "(min-width: 1024px)",
      tablet: "(min-width: 768px) and (max-width: 1023px)",
      mobile: "(max-width: 767px)",
      reduce: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      const element = root.current;
      if (!element) return;
      if (context.conditions?.reduce) {
        replyTimeline.current?.kill();
        gsap.killTweensOf(element.querySelector("[data-safety-panel]"));
        gsap.set(element.querySelector("[data-sms-reply]"), { opacity: 1, y: 0 });
        gsap.set(element.querySelector("[data-safety-panel]"), { scale: 1, y: 0 });
        return;
      }
      const desktop = Boolean(context.conditions?.desktop);
      const wide = desktop || Boolean(context.conditions?.tablet);
      const headline = element.querySelector<HTMLHeadingElement>("#landing-heading");
      if (!headline) return;

      let active = true;
      let started = false;
      let split: SplitText | undefined;
      const scope = gsap.context(() => {}, element);
      const select = gsap.utils.selector(element);
      const refresh = () => ScrollTrigger.refresh();
      const setup = () => {
        if (!active || started) return;
        started = true;
        scope.add(() => {
          let firstSplit = true;
          split = SplitText.create(headline, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            aria: "auto",
            ignore: "[data-sms-word]",
            onSplit: (text) => {
              // Reflow the text without replaying the device entrance on resize.
              if (!firstSplit) return gsap.set(text.lines, { yPercent: 0, rotationX: 0 });
              firstSplit = false;
              const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
              intro.from(text.lines, {
                yPercent: 110,
                rotationX: desktop ? -12 : 0,
                transformOrigin: "50% 100%",
                duration: desktop ? 0.7 : 0.5,
                stagger: 0.08,
              }, 0);
              intro.from(select("[data-laptop-arrival]"), {
                y: 24, scale: 0.96,
                rotationX: desktop ? 7 : 0,
                rotationY: desktop ? -5 : 0,
                transformPerspective: 1100,
                duration: desktop ? 1 : 0.65,
              }, 0.15);
              intro.from(select("[data-sms-underline]"), { scaleX: 0, transformOrigin: "left", duration: desktop ? 0.55 : 0.35 }, desktop ? 0.6 : 0.4);
              intro.from(select("[data-hero-copy]"), { opacity: 0.35, y: 10, duration: desktop ? 0.45 : 0.35 }, desktop ? 0.55 : 0.4);
              intro.from(select("[data-hero-beacon]"), { opacity: 0, scale: 0.8, duration: desktop ? 0.65 : 0.45 }, 0.15);
              return intro;
            },
          });

          if (desktop) {
            gsap.to(select("[data-laptop-parallax]"), {
              y: -32, ease: "none",
              scrollTrigger: { trigger: select("[data-hero]")[0], start: "top top", end: "bottom top", scrub: 0.6 },
            });
          }

          gsap.from(select("[data-demo-panel]"), {
            y: 32, rotationX: desktop ? 3 : 0, autoAlpha: 0,
            duration: 0.6, stagger: 0.12, ease: "power3.out",
            scrollTrigger: { trigger: select("[data-demo-grid]")[0], start: "top 88%", once: true },
          });

          const workflow = select("[data-workflow]")[0];
          const steps = select("[data-workflow-step]") as HTMLElement[];
          if (workflow && wide) {
            const journey = gsap.timeline({
              scrollTrigger: { trigger: workflow, start: "top 85%", end: "bottom 45%", scrub: 0.5 },
            });
            journey.fromTo(select("[data-workflow-line]"), { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", ease: "none", duration: 1 }, 0);
            steps.forEach((step, index) => {
              journey.fromTo(step, { y: 16 }, { y: 0, duration: 0.3, ease: "power2.out" }, index * 0.23);
              journey.fromTo(step.querySelector("[data-step-marker]"), { scale: 0.8, backgroundColor: "#E6EEE8" }, { scale: 1, backgroundColor: "#D2EADF", duration: 0.2 }, index * 0.23);
            });
          } else if (workflow) {
            gsap.fromTo(select("[data-workflow-line]"), { scaleY: 0 }, {
              scaleY: 1, transformOrigin: "top", ease: "none",
              scrollTrigger: { trigger: workflow, start: "top 75%", end: "bottom 65%", scrub: 0.5 },
            });
            steps.forEach((step) => {
              gsap.from(step, { x: 12, autoAlpha: 0, duration: 0.45, ease: "power3.out", scrollTrigger: { trigger: step, start: "top 90%", once: true } });
            });
          }

          (select("[data-quiet-group]") as HTMLElement[]).forEach((group) => {
            gsap.from(group.children, { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.07, ease: "power2.out", scrollTrigger: { trigger: group, start: "top 92%", once: true } });
          });
          ScrollTrigger.refresh();
        });
      };

      // The server-rendered page remains readable while its fonts arrive.
      void document.fonts.ready.then(setup);
      const images = element.querySelectorAll<HTMLImageElement>("[data-laptop-arrival] img");
      images.forEach((image) => image.addEventListener("load", refresh));
      return () => {
        active = false;
        images.forEach((image) => image.removeEventListener("load", refresh));
        split?.revert();
        scope.revert();
      };
    });
    return () => {
      replyTimeline.current?.kill();
      media.revert();
    };
  }, { scope: root });

  useGSAP(() => {
    if (previousCommand.current === selectedCommand) return;
    previousCommand.current = selectedCommand;
    const reply = root.current?.querySelector("[data-sms-reply]");
    const packet = root.current?.querySelector("[data-message-packet]");
    if (!reply || !packet || !motionAllowed()) return;
    replyTimeline.current?.kill();
    const timeline = gsap.timeline()
      .fromTo(packet, { y: -10, autoAlpha: 0, scale: 0.75 }, { y: 18, autoAlpha: 1, scale: 1, duration: 0.22, ease: "power2.inOut" })
      .to(packet, { autoAlpha: 0, duration: 0.08 })
      .fromTo(reply, { y: 8, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out" }, 0.2);
    replyTimeline.current = timeline;
    return () => { timeline.kill(); };
  }, { scope: root, dependencies: [selectedCommand], revertOnUpdate: true });

  useGSAP(() => {
    if (previousSafety.current === simulateGale) return;
    previousSafety.current = simulateGale;
    const panel = root.current?.querySelector("[data-safety-panel]");
    if (!panel || !motionAllowed()) return;
    gsap.killTweensOf(panel);
    gsap.fromTo(panel, { scale: 0.975, y: 4 }, { scale: 1, y: 0, duration: 0.35, ease: "power3.out" });
  }, { scope: root, dependencies: [simulateGale], revertOnUpdate: true });

  return root;
}
