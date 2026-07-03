"use client";

import { useActionState, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { submitInquiry, type InquiryState } from "@/app/actions";

/* The pin lasts 600% of the viewport — every scroll position maps to a
   progress value in [0, 1] that drives the video frame, the progress line
   and which panel is on screen. */
export const PIN_LENGTH = 6;

/* Progress windows for each panel. Gaps between windows guarantee no two
   panels are ever visible at once. */
const PANEL_RANGES: [number, number][] = [
  [0.0, 0.09], // 1 — exterior, studio name
  [0.16, 0.33], // 2 — approaching the entrance, philosophy
  [0.4, 0.55], // 3 — crossing the threshold, stats
  [0.62, 0.79], // 4 — main living space, selected works
  [0.87, 1.01], // 5 — toward the window, contact
];

/* Scroll targets (as progress fractions) used by the navbar. */
export const SCROLL_TARGETS = {
  studio: 0.245,
  works: 0.705,
  contact: 0.96,
} as const;

const STATS = [
  { label: "Projects", value: 142 },
  { label: "Countries", value: 28 },
  { label: "Awards", value: 6 },
];

const WORKS = [
  { name: "Casa Lumen", category: "Private Residence", year: "2023" },
  { name: "The Quarry", category: "Cultural Pavilion", year: "2024" },
  { name: "Atelier Grey", category: "Interior", year: "2021" },
];

const INITIAL: InquiryState = { status: "idle", message: "" };

export function Experience() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inquiry, formAction, pending] = useActionState(submitInquiry, INITIAL);

  useEffect(() => {
    const section = root.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".panel");
      const fill = section.querySelector<HTMLElement>(".progress-fill");
      const hint = section.querySelector<HTMLElement>(".scroll-hint");

      gsap.set(panels, { autoAlpha: 0 });

      /* Scrub the video. The short tween acts as inertia smoothing so the
         decoder isn't hammered with a seek on every scroll event. The video
         itself never plays — only currentTime moves. */
      const seek = (p: number) => {
        const d = video.duration;
        if (!d || Number.isNaN(d)) return;
        const t = Math.min(p, 0.999) * d;
        if (reduce) {
          video.currentTime = t;
          return;
        }
        gsap.to(video, {
          currentTime: t,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      /* One-shot effects that fire each time a panel enters. */
      const enterEffects = (idx: number, panel: HTMLElement) => {
        if (idx === 1) {
          const line = panel.querySelector(".draw-line");
          if (line) {
            gsap.fromTo(
              line,
              { scaleX: 0 },
              {
                scaleX: 1,
                duration: reduce ? 0 : 1,
                delay: reduce ? 0 : 0.25,
                ease: "power3.inOut",
                transformOrigin: "left center",
              }
            );
          }
        }
        if (idx === 2) {
          panel.querySelectorAll<HTMLElement>(".stat-num").forEach((el, i) => {
            const target = Number(el.dataset.target ?? 0);
            const counter = { v: 0 };
            gsap.to(counter, {
              v: target,
              duration: reduce ? 0 : 1.4,
              delay: reduce ? 0 : 0.15 * i,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(counter.v));
              },
            });
          });
        }
      };

      const show = (idx: number) => {
        const panel = panels[idx];
        gsap.killTweensOf(panel);
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: reduce ? 0 : 28 },
          { autoAlpha: 1, y: 0, duration: reduce ? 0.2 : 0.8, ease: "power3.out" }
        );
        enterEffects(idx, panel);
      };

      const hide = (idx: number) => {
        const panel = panels[idx];
        gsap.killTweensOf(panel);
        gsap.to(panel, {
          autoAlpha: 0,
          y: reduce ? 0 : -18,
          duration: reduce ? 0.15 : 0.45,
          ease: "power2.in",
        });
      };

      let active = -1;
      let hintGone = false;

      const update = (p: number) => {
        seek(p);
        if (fill) gsap.set(fill, { scaleY: p });

        if (hint && !hintGone && p > 0.004) {
          hintGone = true;
          gsap.to(hint, { autoAlpha: 0, duration: 0.5, ease: "power2.out" });
        }

        const idx = PANEL_RANGES.findIndex(([a, b]) => p >= a && p <= b);
        if (idx !== active) {
          if (active !== -1) hide(active);
          if (idx !== -1) show(idx);
          active = idx;
        }
      };

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${PIN_LENGTH * 100}%`,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => update(self.progress),
      });

      update(st.progress);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main
      id="top"
      ref={root}
      className="relative h-svh overflow-hidden bg-charcoal text-white"
    >
      {/* Scroll-driven walkthrough. Never autoplays — currentTime is set
          from scroll position only. */}
      <video
        ref={videoRef}
        src="/videos/walkthrough.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
      />

      {/* Panels */}
      <div className="pointer-events-none absolute inset-0">
        {/* 1 — exterior: studio name */}
        <div
          data-cursor="glass"
          className="panel glass pointer-events-auto absolute left-1/2 top-1/2 w-[min(92vw,52rem)] -translate-x-1/2 -translate-y-1/2 px-[clamp(2rem,6vw,5rem)] py-[clamp(2.5rem,6vw,4.5rem)] text-center"
        >
          <h1 className="display text-display uppercase">Forma Studio</h1>
          <p className="label mt-6 text-white/70">
            Architecture &amp; Interior Design — Est. 1998
          </p>
        </div>

        {/* 2 — entrance: philosophy */}
        <div
          data-cursor="glass"
          className="panel glass pointer-events-auto absolute left-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(88vw,26rem)] -translate-y-1/2 p-[clamp(1.75rem,3vw,2.5rem)]"
        >
          <h2 className="display text-heading">We design spaces that endure.</h2>
          <span className="draw-line mt-4 block h-px w-full scale-x-0 bg-white/70" />
          <p className="mt-6 text-sm leading-relaxed text-white/80">
            Forma works at the meeting point of architecture and interior — one
            continuous discipline, not two. We build slowly, precisely, and only
            what deserves to remain.
          </p>
        </div>

        {/* 3 — threshold: stats */}
        <div
          data-cursor="glass"
          className="panel glass pointer-events-auto absolute right-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(80vw,19rem)] -translate-y-1/2 p-[clamp(1.75rem,3vw,2.5rem)]"
        >
          <div className="flex flex-col gap-8">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <span className="label block text-concrete">{stat.label}</span>
                <span className="display mt-1 block text-title tabular-nums">
                  <span className="stat-num" data-target={stat.value}>
                    0
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 — living space: selected works */}
        <div
          data-cursor="glass"
          className="panel glass pointer-events-auto absolute left-1/2 top-1/2 w-[min(92vw,44rem)] -translate-x-1/2 -translate-y-1/2 p-[clamp(1.75rem,4vw,3rem)]"
        >
          <h2 className="display text-title uppercase">Selected Works</h2>
          <ul className="mt-8">
            {WORKS.map((work) => (
              <li
                key={work.name}
                className="flex items-baseline justify-between gap-6 border-t border-white/12 py-4"
              >
                <span className="display text-heading">{work.name}</span>
                <span className="label ml-auto text-concrete">
                  {work.category}
                </span>
                <span className="label text-white/70">{work.year}</span>
              </li>
            ))}
          </ul>
          <a
            href="mailto:studio@formastudio.example?subject=Portfolio%20request"
            data-cursor="cta"
            className="label mt-8 inline-block text-white/70 transition-opacity duration-300 hover:opacity-60 [letter-spacing:0.18em]"
          >
            View All
          </a>
        </div>

        {/* 5 — toward the window: contact */}
        <div
          data-cursor="glass"
          className="panel glass pointer-events-auto absolute left-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(90vw,27rem)] -translate-y-1/2 p-[clamp(1.75rem,3vw,2.5rem)]"
        >
          <h2 className="display text-heading">Start a project.</h2>

          {inquiry.status === "sent" ? (
            <p className="mt-8 text-sm text-white/80">{inquiry.message}</p>
          ) : (
            <form action={formAction} className="mt-8">
              <div className="flex items-end gap-4">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Your email"
                  aria-label="Your email"
                  className="w-full border-0 border-b border-white/30 bg-transparent py-2 text-sm text-white outline-none transition-colors duration-300 placeholder:text-concrete focus:border-white/70"
                />
                <button
                  type="submit"
                  disabled={pending}
                  data-cursor="cta"
                  className="label shrink-0 pb-2 text-white transition-opacity duration-300 hover:opacity-60 disabled:opacity-40"
                >
                  {pending ? "Sending" : "Send"}
                </button>
              </div>
              {inquiry.status === "error" && (
                <p className="mt-3 text-xs text-white/60">{inquiry.message}</p>
              )}
            </form>
          )}

          <div className="mt-10 text-sm text-white/60">
            <a
              href="mailto:studio@formastudio.example"
              data-cursor="cta"
              className="transition-colors duration-300 hover:text-white"
            >
              studio@formastudio.example
            </a>
            <br />
            Copenhagen
          </div>
        </div>
      </div>

      {/* Progress line — right edge, fills as the video advances */}
      <div className="absolute inset-y-[clamp(1.5rem,4vh,3rem)] right-[10px] w-px bg-white/15">
        <div className="progress-fill h-full w-full origin-top scale-y-0 bg-white" />
      </div>

      {/* Scroll hint — pulses at the start, gone once the user moves */}
      <div className="scroll-hint pulse-soft label pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-white">
        Scroll to Explore ↓
      </div>
    </main>
  );
}
