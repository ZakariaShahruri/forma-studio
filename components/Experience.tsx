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
    let removeVideoListeners = () => {};
    let removePreloader = () => {};

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".panel");
      const fill = section.querySelector<HTMLElement>(".progress-fill");
      const hint = section.querySelector<HTMLElement>(".scroll-hint");
      const endFade = section.querySelector<HTMLElement>(".end-fade");

      gsap.set(panels, { autoAlpha: 0 });

      /* Scrub the video. The short tween acts as inertia smoothing so the
         decoder isn't hammered with a seek on every scroll event. The video
         itself never plays — only currentTime moves.

         The video completes at SCRUB_END of the pin, not at 1: the seek tween
         trails scroll by ~0.4s, so finishing early guarantees the walkthrough
         is fully seen — final frame held — before the pin releases. */
      const SCRUB_END = 0.94;
      const seek = (p: number) => {
        const d = video.duration;
        if (!d || Number.isNaN(d)) return;
        const t = Math.min(p / SCRUB_END, 0.9975) * d;
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

      /* Adaptive glass: sample the video's brightness behind the active
         panel and flip its tint — white glass over dark scenes, dark glass
         over light ones. The frame is drawn into a tiny canvas and only the
         region under the panel (mapped through object-cover) is averaged.
         Thresholds have hysteresis so mid-tone frames never flicker. */
      const sceneCanvas = document.createElement("canvas");
      sceneCanvas.width = 96;
      sceneCanvas.height = 54;
      const sceneCtx = sceneCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      let lastSample = 0;

      const sampleScene = (panel: HTMLElement) => {
        if (!sceneCtx || video.readyState < 2 || !video.videoWidth) return;
        try {
          sceneCtx.drawImage(video, 0, 0, sceneCanvas.width, sceneCanvas.height);
        } catch {
          return;
        }
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scale = Math.max(vw / video.videoWidth, vh / video.videoHeight);
        const dispW = video.videoWidth * scale;
        const dispH = video.videoHeight * scale;
        const offX = (dispW - vw) / 2;
        const offY = (dispH - vh) / 2;
        const rect = panel.getBoundingClientRect();
        const sx = Math.max(0, Math.floor(((rect.left + offX) / dispW) * sceneCanvas.width));
        const sy = Math.max(0, Math.floor(((rect.top + offY) / dispH) * sceneCanvas.height));
        const ex = Math.min(sceneCanvas.width, Math.ceil(((rect.right + offX) / dispW) * sceneCanvas.width));
        const ey = Math.min(sceneCanvas.height, Math.ceil(((rect.bottom + offY) / dispH) * sceneCanvas.height));
        if (ex - sx < 1 || ey - sy < 1) return;
        const data = sceneCtx.getImageData(sx, sy, ex - sx, ey - sy).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        const lum = sum / (data.length / 4) / 255;
        /* White glass brightens the backdrop, so white text stops passing
           WCAG AA (4.5:1) once the scene behind exceeds ~0.40 luminance —
           that's the flip point, with hysteresis against flicker. */
        const scene = panel.dataset.scene;
        if (scene === "light" ? lum < 0.36 : lum > 0.42) {
          panel.dataset.scene = scene === "light" ? "dark" : "light";
        }
      };

      const sampleActive = (force = false) => {
        const now = performance.now();
        if (!force && now - lastSample < 180) return;
        lastSample = now;
        if (active !== -1) sampleScene(panels[active]);
      };

      const onFrame = () => sampleActive();
      video.addEventListener("seeked", onFrame);
      video.addEventListener("loadeddata", onFrame);
      removeVideoListeners = () => {
        video.removeEventListener("seeked", onFrame);
        video.removeEventListener("loadeddata", onFrame);
      };

      const update = (p: number) => {
        seek(p);
        if (fill) gsap.set(fill, { scaleY: p });

        /* Ease the handoff to the footer: once the video has completed,
           the last stretch of the pin dims toward charcoal so the release
           is a soft transition rather than a hard cut. */
        if (endFade) {
          gsap.set(endFade, {
            opacity: gsap.utils.clamp(0, 1, (p - 0.96) / 0.04) * 0.45,
          });
        }

        if (hint && !hintGone && p > 0.004) {
          hintGone = true;
          gsap.to(hint, { autoAlpha: 0, duration: 0.5, ease: "power2.out" });
        }

        const idx = PANEL_RANGES.findIndex(([a, b]) => p >= a && p <= b);
        if (idx !== active) {
          if (active !== -1) hide(active);
          if (idx !== -1) show(idx);
          active = idx;
          sampleActive(true);
        } else {
          sampleActive();
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

      /* ---- Preloader -------------------------------------------------
         A full-viewport still of the house exterior (the same view the
         video opens on) holds the screen while the walkthrough buffers.
         Scroll is locked so the experience always begins from frame 0;
         the fade-out lands on the identical first frame — no cut. */
      const preloader = section.querySelector<HTMLElement>(".preloader");
      const preContent = section.querySelector<HTMLElement>(".preloader-content");
      const preFill = section.querySelector<HTMLElement>(".preloader-fill");

      if (preloader && preContent && preFill) {
        document.body.style.overflow = "hidden";
        const t0 = performance.now();

        gsap.to(preContent, {
          opacity: 1,
          duration: reduce ? 0.2 : 1,
          delay: 0.15,
          ease: "power2.out",
        });

        /* Enough of the head of the video to scrub the opening without
           stalling — the rest keeps buffering behind the experience. */
        const READY_SECONDS = 5;
        let preDone = false;

        const bufferedFromStart = () => {
          try {
            for (let i = 0; i < video.buffered.length; i++) {
              if (video.buffered.start(i) <= 0.1) return video.buffered.end(i);
            }
          } catch {
            /* buffered ranges can throw mid-load */
          }
          return 0;
        };

        const finish = () => {
          if (preDone) return;
          preDone = true;
          window.clearInterval(prePoll);
          window.clearTimeout(preFailsafe);
          gsap.to(preFill, { scaleX: 1, duration: 0.25, ease: "power1.out" });
          // Hold briefly so a fast load still reads as a deliberate opening.
          const elapsed = performance.now() - t0;
          gsap.to(preloader, {
            autoAlpha: 0,
            duration: reduce ? 0.2 : 1.1,
            delay: Math.max(0.3, (1100 - elapsed) / 1000),
            ease: "power2.inOut",
            onComplete: () => {
              document.body.style.overflow = "";
            },
          });
        };

        const onBuffer = () => {
          if (preDone) return;
          const p = Math.min(bufferedFromStart() / READY_SECONDS, 1);
          gsap.to(preFill, {
            scaleX: p,
            duration: 0.3,
            ease: "power1.out",
            overwrite: "auto",
          });
          if (p >= 1 && video.readyState >= 3) finish();
        };

        video.addEventListener("progress", onBuffer);
        video.addEventListener("canplaythrough", onBuffer);
        video.addEventListener("loadeddata", onBuffer);
        // Some engines fire `progress` sparsely — poll as a backstop.
        const prePoll = window.setInterval(onBuffer, 250);
        // Never trap the visitor behind a stalled network.
        const preFailsafe = window.setTimeout(finish, 10000);
        onBuffer();

        removePreloader = () => {
          window.clearInterval(prePoll);
          window.clearTimeout(preFailsafe);
          video.removeEventListener("progress", onBuffer);
          video.removeEventListener("canplaythrough", onBuffer);
          video.removeEventListener("loadeddata", onBuffer);
          document.body.style.overflow = "";
        };
      }
    }, root);

    return () => {
      removePreloader();
      removeVideoListeners();
      ctx.revert();
    };
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

      {/* Uniform charcoal dim over the final stretch of the pin — no
          gradient, just a quiet fade toward the footer's surface. */}
      <div className="end-fade pointer-events-none absolute inset-0 bg-charcoal opacity-0" />

      {/* Panels */}
      <div className="pointer-events-none absolute inset-0">
        {/* 1 — exterior: studio name */}
        <div
          data-cursor="glass"
          data-scene="dark"
          className="panel glass pointer-events-auto absolute left-1/2 top-1/2 w-[min(94vw,64rem)] -translate-x-1/2 -translate-y-1/2 px-[clamp(2rem,6vw,5rem)] py-[clamp(2.5rem,6vw,4.5rem)] text-center"
        >
          <h1 className="display text-hero uppercase leading-[0.95]">
            <span className="block">Forma</span>
            <span className="block">Studio</span>
          </h1>
          <p className="label mt-8 text-white/95">
            Architecture &amp; Interior Design — Est. 1998
          </p>
        </div>

        {/* 2 — entrance: philosophy */}
        <div
          data-cursor="glass"
          data-scene="dark"
          className="panel glass pointer-events-auto absolute left-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(90vw,34rem)] -translate-y-1/2 p-[clamp(2rem,3.5vw,3rem)]"
        >
          <h2 className="display text-title">We design spaces that endure.</h2>
          <span className="draw-line mt-5 block h-px w-full scale-x-0 bg-white/80" />
          <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-white/95">
            Forma works at the meeting point of architecture and interior — one
            continuous discipline, not two. We build slowly, precisely, and only
            what deserves to remain.
          </p>
        </div>

        {/* 3 — threshold: stats */}
        <div
          data-cursor="glass"
          data-scene="dark"
          className="panel glass pointer-events-auto absolute right-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(84vw,22rem)] -translate-y-1/2 p-[clamp(2rem,3.5vw,3rem)]"
        >
          <div className="flex flex-col gap-8">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <span className="label block text-white/95">{stat.label}</span>
                <span className="display mt-1 block text-display tabular-nums">
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
          data-scene="dark"
          className="panel glass pointer-events-auto absolute left-1/2 top-1/2 w-[min(94vw,54rem)] -translate-x-1/2 -translate-y-1/2 p-[clamp(2rem,4vw,3.5rem)]"
        >
          <h2 className="display text-display uppercase">Selected Works</h2>
          <ul className="mt-8">
            {WORKS.map((work) => (
              <li
                key={work.name}
                className="flex items-baseline justify-between gap-6 border-t border-white/15 py-4"
              >
                <span className="display text-heading">{work.name}</span>
                <span className="label ml-auto text-white/95">
                  {work.category}
                </span>
                <span className="label text-white/95">{work.year}</span>
              </li>
            ))}
          </ul>
          <a
            href="mailto:studio@formastudio.example?subject=Portfolio%20request"
            data-cursor="cta"
            className="label mt-8 inline-block text-white/95 transition-opacity duration-300 hover:opacity-60 [letter-spacing:0.18em]"
          >
            View All
          </a>
        </div>

        {/* 5 — toward the window: contact */}
        <div
          data-cursor="glass"
          data-scene="dark"
          className="panel glass pointer-events-auto absolute left-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(90vw,32rem)] -translate-y-1/2 p-[clamp(2rem,3.5vw,3rem)]"
        >
          <h2 className="display text-title">Start a project.</h2>

          {inquiry.status === "sent" ? (
            <p className="mt-8 text-base text-white/95">{inquiry.message}</p>
          ) : (
            <form action={formAction} className="mt-8">
              <div className="flex items-end gap-4">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Your email"
                  aria-label="Your email"
                  className="w-full border-0 border-b border-white/40 bg-transparent py-2 text-base text-white outline-none transition-colors duration-300 placeholder:text-white/75 focus:border-white/80"
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
                <p className="mt-3 text-sm text-white/95">{inquiry.message}</p>
              )}
            </form>
          )}

          <div className="mt-10 text-base text-white/95">
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

      {/* Preloader — the exterior still the walkthrough opens on. Fades
          out onto the identical first video frame once enough of the
          walkthrough has buffered. */}
      <div className="preloader absolute inset-0 z-40 bg-charcoal">
        <img
          src="/images/preloader.jpg"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="preloader-content absolute inset-0 flex flex-col items-center justify-center gap-10 opacity-0 [text-shadow:0_1px_3px_rgba(0,0,0,0.45),0_2px_16px_rgba(0,0,0,0.3)]">
          <span className="display text-hero text-center uppercase leading-[0.95]">
            <span className="block">Forma</span>
            <span className="block">Studio</span>
          </span>
          {/* Buffering progress — a thin rule that fills as the video loads */}
          <span className="block h-px w-44 bg-white/25">
            <span className="preloader-fill block h-full w-full origin-left scale-x-0 bg-white" />
          </span>
        </div>
      </div>
    </main>
  );
}
