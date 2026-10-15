"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  LockKeyhole,
  Maximize2,
  Printer,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InformationShell } from "./InformationShell";
import { ScreenshotDialog, type GuideImage } from "./ScreenshotDialog";
import { STEPS } from "./guide-data";
import {
  readProgress,
  saveProgress,
  serverProgress,
  subscribeProgress,
  validateProgress,
} from "./guide-progress";
import { allowsMotion } from "./useInformationMotion";
import styles from "./information.module.css";
const ids = STEPS.map((step) => step.id);
const categories = [
  "Account & Onboarding",
  "Vessel & Port",
  "Advisories & At Sea",
];
const lessonNames = [
  "Create your account",
  "Complete onboarding",
  "Find your home port",
  "Update your home port",
  "Read an SMS advisory",
  "Check fish predictions",
  "Trip reporting (planned)",
  "Respond to a safety hold",
  "Use the Municipal Advisor",
];

export function GuideContent() {
  const root = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  const reward = useRef<HTMLDivElement>(null);
  const lessonIndex = useRef<HTMLDetailsElement>(null);
  const [activeStepId, setActiveStepId] = useState(ids[0]);
  const [zoomImage, setZoomImage] = useState<GuideImage | null>(null);
  const [temporaryProgress, setTemporaryProgress] = useState(false);
  const raw = useSyncExternalStore(
    subscribeProgress,
    readProgress,
    serverProgress,
  );
  const completed = useMemo(() => validateProgress(raw, ids), [raw]);
  const hydrated = raw !== null;
  const count = completed.length;
  const finished = count === STEPS.length;
  const previousCount = useRef<number | null>(null);
  const celebrated = useRef(false);
  const previousStep = useRef(activeStepId);
  const activeIndex = Math.max(0, ids.indexOf(activeStepId));
  const step = STEPS[activeIndex];
  const closeImage = useCallback(() => setZoomImage(null), []);
  useEffect(() => {
    let alive = true;
    const syncHash = () => {
      const id = window.location.hash.slice(1);
      if (alive && ids.includes(id)) setActiveStepId(id);
    };
    queueMicrotask(syncHash);
    window.addEventListener("hashchange", syncHash);
    return () => {
      alive = false;
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);
  useEffect(() => {
    const workspace = root.current;
    if (!workspace) return;
    let width = workspace.clientWidth;
    const update = () => {
      if (lessonIndex.current)
        lessonIndex.current.open =
          getComputedStyle(workspace).display === "grid";
    };
    update();
    const observer = new ResizeObserver(() => {
      if (workspace.clientWidth !== width) {
        width = workspace.clientWidth;
        update();
      }
    });
    observer.observe(workspace);
    return () => observer.disconnect();
  }, []);
  useGSAP(
    () => {
      if (previousStep.current === activeStepId) return;
      previousStep.current = activeStepId;
      if (article.current)
        gsap.fromTo(
          article.current,
          { y: allowsMotion() ? 8 : 0, opacity: allowsMotion() ? 0.45 : 1 },
          {
            y: 0,
            opacity: 1,
            duration: allowsMotion() ? 0.28 : 0,
            overwrite: true,
            ease: "power2.out",
            onComplete: () => ScrollTrigger.refresh(),
          },
        );
    },
    { scope: root, dependencies: [activeStepId] },
  );
  useGSAP(
    () => {
      if (!hydrated) return;
      const before = previousCount.current;
      previousCount.current = count;
      const motion = allowsMotion();
      const fill = root.current?.querySelector("[data-progress-fill]");
      if (fill)
        gsap.to(fill, {
          scaleX: count / STEPS.length,
          duration: before === null || !motion ? 0 : 0.35,
          ease: "power2.out",
          overwrite: true,
        });
      if (before === null) {
        celebrated.current = finished;
        return;
      }
      const check = root.current?.querySelector("[data-complete-check]");
      if (check && count > before && motion)
        gsap.fromTo(
          check,
          { scale: 0.7 },
          { scale: 1, duration: 0.22, ease: "back.out(1.5)", overwrite: true },
        );
      if (finished && !celebrated.current && reward.current) {
        celebrated.current = true;
        if (motion) {
          const timeline = gsap.timeline({
            onComplete: () => ScrollTrigger.refresh(),
          });
          timeline.fromTo(
            reward.current,
            { opacity: 0.3, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
          );
          timeline.fromTo(
            reward.current.querySelector("[data-badge-check]"),
            { strokeDashoffset: 40 },
            { strokeDashoffset: 0, duration: 0.35 },
            0.25,
          );
          const particles = reward.current.querySelectorAll("[data-confetti]");
          timeline.fromTo(
            particles,
            { x: 0, y: 0, opacity: 1, rotation: 0 },
            {
              x: (index) => (index - 5.5) * 17,
              y: (index) => -24 - (index % 4) * 10,
              rotation: (index) => index * 28,
              opacity: 0,
              duration: 0.65,
              stagger: 0.015,
              ease: "power2.out",
            },
            0.25,
          );
        }
      }
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [count, hydrated, finished] },
  );
  const chooseStep = (id: string, moveFocus = false) => {
    if (!ids.includes(id)) return;
    setActiveStepId(id);
    window.history.replaceState(null, "", `#${id}`);
    if (moveFocus || window.innerWidth < 1024)
      requestAnimationFrame(() => {
        if (!article.current) return;
        article.current.scrollIntoView({
          block: "start",
          behavior: allowsMotion() ? "smooth" : "instant",
        });
        if (moveFocus)
          article.current
            .querySelector<HTMLHeadingElement>("h2")
            ?.focus({ preventScroll: true });
      });
  };
  const toggleComplete = (id: string) => {
    const latest = validateProgress(readProgress(), ids);
    const updated = latest.includes(id)
      ? latest.filter((item) => item !== id)
      : [...latest, id];
    setTemporaryProgress(!saveProgress(updated));
  };
  return (
    <InformationShell page="guide">
      <main id="guide-main" className={styles.container} tabIndex={-1}>
        <div className={styles.hero} data-entry>
          <span className={styles.eyebrow}>The Parola field guide</span>
          <h1>Learn Parola.</h1>
          <p className={styles.intro}>
            Nine short lessons. Start here.
          </p>
        </div>
        <div ref={root} className={styles.workspace}>
          <aside
            className={styles.guideAside}
            aria-label="Guide progress and lessons"
            data-entry
          >
            <div className={styles.progressCard}>
              <div className={styles.progressLabel}>
                <span>Your progress</span>
                <strong>{hydrated ? `${count} of 9` : "Loading…"}</strong>
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Completed guide lessons"
                aria-valuemin={0}
                aria-valuemax={9}
                aria-valuenow={hydrated ? count : undefined}
                aria-valuetext={
                  hydrated
                    ? `${count} of 9 lessons reviewed`
                    : "Loading saved progress"
                }
              >
                <div className={styles.progressFill} data-progress-fill />
              </div>
              <p
                className={styles.progressNote}
                aria-live="polite"
                aria-atomic="true"
              >
                {hydrated
                  ? finished
                    ? "All nine lessons reviewed."
                    : `${9 - count} lessons remaining.`
                  : "Checking saved progress."}
              </p>
              {temporaryProgress && (
                <p className={styles.progressNote}>
                  Progress is saved only for this visit.
                </p>
              )}
              <div
                className={styles.reward}
                ref={reward}
                data-guide-reward
                data-unlocked={finished}
              >
                {finished ? (
                  <>
                    <div className={styles.rewardBadge}>
                      <svg
                        width="48"
                        height="56"
                        viewBox="0 0 48 56"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M24 2 44 12v25L24 54 4 37V12L24 2Z"
                          fill="#e1efe6"
                          stroke="currentColor"
                        />
                        <path
                          d="M19 18h10l3 16H16l3-16Zm-3 16h16M21 14h6v4h-6zM24 9v3M12 15l4 2m20-2-4 2"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <path
                          data-badge-check
                          d="m16 41 5 5 12-12"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="40"
                        />
                      </svg>
                      <div>
                        <strong>System guide completed</strong>
                        <p>You’ve reviewed all nine lessons.</p>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => window.print()}
                      >
                        <Printer size={14} />
                        Print quick reference
                      </button>
                      <Link
                        href="/dashboard"
                        className={styles.secondaryButton}
                      >
                        Open dashboard
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                    {Array.from({ length: 12 }, (_, index) => (
                      <i
                        key={index}
                        className={styles.confetti}
                        data-confetti
                        aria-hidden="true"
                      />
                    ))}
                  </>
                ) : (
                  <div className={styles.rewardPreview}>
                    <LockKeyhole size={15} />
                    <span>
                      Complete all 9 lessons to unlock your guide badge and
                      quick reference.
                    </span>
                  </div>
                )}
              </div>
            </div>
            <label className={styles.mobileSelector}>
              Lesson {activeIndex + 1} of 9
              <select
                aria-label="Choose a guide lesson"
                value={activeStepId}
                onChange={(event) => chooseStep(event.target.value)}
              >
                {STEPS.map((item, index) => (
                  <option key={item.id} value={item.id}>
                    {index + 1}. {lessonNames[index]}
                  </option>
                ))}
              </select>
            </label>
            <details ref={lessonIndex} className={styles.lessonIndex}>
              <summary className={styles.indexSummary}>
                All nine lessons
                <ChevronDown size={15} />
              </summary>
              <div className={styles.indexContent}>
                {categories.map((category) => (
                  <div className={styles.category} key={category}>
                    <p className={styles.categoryHeading}>
                      <span>{category}</span>
                      <span>
                        {
                          STEPS.filter(
                            (item) =>
                              item.category === category &&
                              completed.includes(item.id),
                          ).length
                        }
                        /
                        {
                          STEPS.filter((item) => item.category === category)
                            .length
                        }
                      </span>
                    </p>
                    {STEPS.filter((item) => item.category === category).map(
                      (item) => (
                        <div
                          key={item.id}
                          className={styles.lessonRow}
                          data-active={item.id === activeStepId}
                        >
                          <label className={styles.checkLabel}>
                            <input
                              type="checkbox"
                              disabled={!hydrated}
                              checked={completed.includes(item.id)}
                              onChange={() => toggleComplete(item.id)}
                              aria-label={`Mark lesson ${item.stepNumber} complete: ${lessonNames[item.stepNumber - 1]}`}
                            />
                          </label>
                          <button
                            className={styles.lessonChoice}
                            data-lesson-id={item.id}
                            aria-current={
                              item.id === activeStepId ? "step" : undefined
                            }
                            onClick={() => chooseStep(item.id)}
                          >
                            <span>
                              {item.stepNumber}.{" "}
                              {lessonNames[item.stepNumber - 1]}
                            </span>
                            <small>
                              {item.duration}
                              {completed.includes(item.id) ? " · Reviewed" : ""}
                            </small>
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </details>
          </aside>
          <article
            ref={article}
            className={styles.article}
            aria-labelledby="lesson-heading"
            data-entry
          >
            <div className={styles.articleHeader}>
              <div className={styles.articleMeta}>
                <span>{step.category}</span>
                <span>
                  Lesson {step.stepNumber} / 9 · {step.duration}
                </span>
              </div>
              <h2 id="lesson-heading" tabIndex={-1}>
                {lessonNames[activeIndex]}
              </h2>
              <p>{step.shortDesc}</p>
            </div>
            <h3>Follow these steps</h3>
            <ol className={styles.checklist}>
              {step.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
            <figure className={styles.screenshot}>
              <button
                className={styles.screenshotButton}
                type="button"
                aria-label={`Enlarge screenshot: ${lessonNames[activeIndex]}`}
                onClick={() =>
                  setZoomImage({
                    src: step.image,
                    title: lessonNames[activeIndex],
                    caption: step.imageCaption,
                    alt: step.imageAlt,
                  })
                }
              >
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  sizes="(max-width: 1023px) 90vw, 820px"
                  className="object-contain"
                  priority={activeIndex === 0}
                />
                <span className={styles.zoomLabel}>
                  <Maximize2 size={13} />
                  Enlarge screenshot
                </span>
              </button>
              <figcaption>{step.imageCaption}</figcaption>
            </figure>
            <div className={styles.tip}>
              <strong>At sea / at port</strong>
              <p>{step.operationalTip}</p>
            </div>
            <Link href={step.actionUrl} className={styles.textLink}>
              {step.actionLabel}
              <ExternalLink size={13} />
            </Link>
            <div className={styles.lessonActions}>
              <button
                type="button"
                disabled={!hydrated}
                className={
                  completed.includes(step.id)
                    ? styles.button
                    : styles.secondaryButton
                }
                aria-pressed={completed.includes(step.id)}
                onClick={() => toggleComplete(step.id)}
              >
                <Check size={16} data-complete-check />
                {completed.includes(step.id)
                  ? "Reviewed — undo"
                  : "Mark as complete"}
              </button>
              <div className={styles.lessonNav}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={activeIndex === 0}
                  aria-label="Previous lesson"
                  onClick={() => chooseStep(ids[activeIndex - 1], true)}
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={activeIndex === 8}
                  onClick={() => chooseStep(ids[activeIndex + 1], true)}
                >
                  Next lesson
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
            <span className={styles.srOnly} role="status" aria-live="polite">
              Lesson {step.stepNumber} of 9: {lessonNames[activeIndex]}
            </span>
          </article>
        </div>
        <ScreenshotDialog image={zoomImage} onClose={closeImage} />
        {hydrated &&
          finished &&
          createPortal(
            <section className={styles.printReference} data-parola-print>
              <p>PAROLA / KEEP AT HAND</p>
              <h1>Your coastal quick reference</h1>
              <p>
                System guide completed. You’ve reviewed all nine lessons. This
                is a learning checklist, not a certification or departure
                clearance.
              </p>
              <h2>Outbound SMS — planned schedule</h2>
              <p>
                Routine SMS for up to five selected weekdays and separate any-day
                critical alerts are planned. The current portal offers manual
                weather requests when enabled; automatic scheduling is not available.
              </p>
              <ul>
                <li>
                  <strong>Routine day</strong> — a planned selected-day advisory.
                </li>
                <li>
                  <strong>Critical alert</strong> — planned separately, including
                  days without routine advisories.
                </li>
                <li>
                  <strong>Receipt</strong> — gateway acceptance does not confirm delivery.
                </li>
              </ul>
              <p>No inbound commands or replies are required. Reading delivered SMS needs no mobile data; registration, portal use and future voluntary reporting need internet. Delivery depends on the service and cellular network.</p>
              <h2>Before departure</h2>
              <ul>
                <li>Check your latest weather advisory and any safety hold.</li>
                <li>Review your registered vessel and home port.</li>
                <li>Follow official port and Coast Guard instructions.</li>
                <li>
                  Review hotspot guidance alongside current sea conditions.
                </li>
                <li>Voluntary trip reporting is planned; no report or rating reply is required to receive advisories.</li>
              </ul>
              <h2>Review a lesson</h2>
              <ul>
                {[4, 7, 6].map((index) => (
                  <li key={ids[index]}>
                    <a href={`${window.location.origin}/guide#${ids[index]}`}>
                      {lessonNames[index]}
                    </a>
                  </li>
                ))}
              </ul>
            </section>,
            document.body,
          )}
      </main>
    </InformationShell>
  );
}
