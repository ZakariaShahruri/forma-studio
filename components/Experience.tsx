"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import {
  NameContent,
  PhilosophyContent,
  StatsContent,
  WorksContent,
  ContactContent,
} from "@/components/panels";

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

type Env = { mode: "mobile" | "desktop"; low: boolean };

/* Touch devices and small screens get the static experience; on desktop,
   few cores / little memory / a constrained connection selects the low
   tier: 720p video, opacity-only transitions, no backdrop blur. */
function detectEnv(): Env {
  const mobile =
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(pointer: coarse) and (hover: none)").matches;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const conn = nav.connection;
  const slowNet =
    !!conn && (!!conn.saveData || /(slow-2g|2g|3g)/.test(conn.effectiveType ?? ""));

  return { mode: mobile ? "mobile" : "desktop", low: cores <= 4 || memory <= 4 || slowNet };
}

export function Experience() {
  const [env, setEnv] = useState<Env | null>(null);

  useEffect(() => {
    setEnv(detectEnv());
  }, []);

  if (env?.mode === "mobile") return <MobileExperience />;
  if (env?.mode === "desktop") return <DesktopExperience low={env.low} />;

  /* Pre-hydration / first frame: the same exterior still both paths open
     on, so whichever experience mounts is visually continuous. */
  return (
    <main id="top" className="relative h-svh overflow-hidden bg-charcoal text-white">
      <img
        src="/images/preloader.jpg"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </main>
  );
}

/* =====================================================================
   Mobile — the walkthrough video is replaced by the exterior still as a
   fixed backdrop; the panels stack and scroll normally. No pin, no
   scrubbing, no per-frame work at all: reveals are IntersectionObserver
   toggling a CSS opacity transition.
   ===================================================================== */
function MobileExperience() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2 }
    );
    root.current
      ?.querySelectorAll(".m-reveal")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const section = "flex min-h-svh items-center justify-center px-5 py-24";
  const card = "glass m-reveal w-full max-w-xl p-8";

  return (
    <main
      id="top"
      ref={root}
      data-experience="mobile"
      className="relative bg-charcoal text-white"
    >
      {/* Static full-viewport backdrop — the house exterior. A uniform dim
          keeps the glass text legible at every scroll position. */}
      <div className="fixed inset-0" aria-hidden>
        <img
          src="/images/preloader.jpg"
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/35" />
      </div>

      <div className="relative">
        <section className={section}>
          <div data-scene="light" className={`${card} text-center`}>
            <NameContent />
          </div>
        </section>

        <section id="studio" className={section}>
          <div data-scene="light" className={card}>
            <PhilosophyContent animated={false} />
          </div>
        </section>

        <section className={section}>
          <div data-scene="light" className={card}>
            <StatsContent animated={false} />
          </div>
        </section>

        <section id="works" className={section}>
          <div data-scene="light" className={card}>
            <WorksContent />
          </div>
        </section>

        <section id="contact" className={section}>
          <div data-scene="light" className={card}>
            <ContactContent />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =====================================================================
   Desktop — the pinned, scroll-scrubbed walkthrough.
   ===================================================================== */
function DesktopExperience({ low }: { low: boolean }) {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = root.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Low tier drops transform work from panel transitions entirely —
       fades are opacity-only, exactly like reduced motion. */
    const simple = reduce || low;
    let removeVideoListeners = () => {};
    let removePreloader = () => {};

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".panel");
      const fill = section.querySelector<HTMLElement>(".progress-fill");
      const hint = section.querySelector<HTMLElement>(".scroll-hint");
      const endFade = section.querySelector<HTMLElement>(".end-fade");

      /* GSAP owns panel centering outright (xPercent/yPercent) — mixing a
         CSS translate class with GSAP y-tweens loses the -50% whenever the
         first tween's transform parse misses it. */
      panels.forEach((panel) => {
        gsap.set(panel, {
          autoAlpha: 0,
          yPercent: -50,
          xPercent: panel.dataset.center === "both" ? -50 : 0,
        });
      });

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

      /* will-change is applied only for the duration of a transition and
         released as soon as it completes — holding layers alive across the
         whole pin is what causes compositor pressure on weaker GPUs. */
      const show = (idx: number) => {
        const panel = panels[idx];
        gsap.killTweensOf(panel);
        gsap.set(panel, { willChange: simple ? "opacity" : "opacity, transform" });
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: simple ? 0 : 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: reduce ? 0.2 : low ? 0.5 : 0.8,
            ease: "power3.out",
            onComplete: () => gsap.set(panel, { willChange: "auto" }),
          }
        );
        enterEffects(idx, panel);
      };

      const hide = (idx: number) => {
        const panel = panels[idx];
        gsap.killTweensOf(panel);
        gsap.set(panel, { willChange: simple ? "opacity" : "opacity, transform" });
        gsap.to(panel, {
          autoAlpha: 0,
          y: simple ? 0 : -18,
          duration: reduce ? 0.15 : low ? 0.3 : 0.45,
          ease: "power2.in",
          onComplete: () => gsap.set(panel, { willChange: "auto" }),
        });
      };

      let active = -1;
      let hintGone = false;

      /* Adaptive glass: sample the video's brightness behind the active
         panel and flip its tint — white glass over dark scenes, dark glass
         over light ones. The frame is drawn into a tiny canvas and only the
         region under the panel (mapped through object-cover) is averaged.
         Thresholds have hysteresis so mid-tone frames never flicker.
         Skipped entirely on the low tier, whose glass is a solid tint. */
      const sceneCanvas = document.createElement("canvas");
      sceneCanvas.width = 96;
      sceneCanvas.height = 54;
      const sceneCtx = low
        ? null
        : sceneCanvas.getContext("2d", { willReadFrequently: true });
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
        if (!sceneCtx) return;
        const now = performance.now();
        if (!force && now - lastSample < 180) return;
        lastSample = now;
        // Panel 1 keeps its fixed dark glass — see its markup.
        if (active > 0) sampleScene(panels[active]);
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
  }, [low]);

  return (
    <main
      id="top"
      ref={root}
      className={`relative h-svh overflow-hidden bg-charcoal text-white ${
        low ? "perf-low" : ""
      }`}
    >
      {/* Scroll-driven walkthrough. Never autoplays — currentTime is set
          from scroll position only. The low tier decodes the 720p
          rendition: half the pixels, half the bandwidth. */}
      <video
        ref={videoRef}
        src={low ? "/videos/walkthrough-720.mp4" : "/videos/walkthrough.mp4"}
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
        {/* 1 — exterior: studio name. Always dark glass and excluded from
            scene sampling: its backdrop is the bright-skied exterior (still
            and video alike), where white glass washes the name out. */}
        <div
          data-cursor="glass"
          data-scene="light"
          data-center="both"
          className="panel glass pointer-events-auto absolute left-1/2 top-1/2 w-[min(94vw,64rem)] px-[clamp(2rem,6vw,5rem)] py-[clamp(2.5rem,6vw,4.5rem)] text-center"
        >
          <NameContent />
        </div>

        {/* 2 — entrance: philosophy */}
        <div
          data-cursor="glass"
          data-scene="dark"
          data-center="y"
          className="panel glass pointer-events-auto absolute left-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(90vw,34rem)] p-[clamp(2rem,3.5vw,3rem)]"
        >
          <PhilosophyContent animated />
        </div>

        {/* 3 — threshold: stats */}
        <div
          data-cursor="glass"
          data-scene="dark"
          data-center="y"
          className="panel glass pointer-events-auto absolute right-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(84vw,22rem)] p-[clamp(2rem,3.5vw,3rem)]"
        >
          <StatsContent animated />
        </div>

        {/* 4 — living space: selected works */}
        <div
          data-cursor="glass"
          data-scene="dark"
          data-center="both"
          className="panel glass pointer-events-auto absolute left-1/2 top-1/2 w-[min(94vw,54rem)] p-[clamp(2rem,4vw,3.5rem)]"
        >
          <WorksContent />
        </div>

        {/* 5 — toward the window: contact */}
        <div
          data-cursor="glass"
          data-scene="dark"
          data-center="y"
          className="panel glass pointer-events-auto absolute left-[clamp(1.25rem,4vw,4rem)] top-1/2 w-[min(90vw,32rem)] p-[clamp(2rem,3.5vw,3rem)]"
        >
          <ContactContent />
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
        <div className="preloader-content absolute inset-0 flex flex-col items-center justify-center gap-8 opacity-0">
          {/* The same glass lockup as panel 1, so the name is legible over
              any part of the still and the fade-out lands on an identical
              panel — the buffering rule is the only thing that leaves. */}
          <div
            data-scene="light"
            className="glass w-[min(94vw,64rem)] px-[clamp(2rem,6vw,5rem)] py-[clamp(2.5rem,6vw,4.5rem)] text-center"
          >
            <NameContent heading={false} />
          </div>
          {/* Buffering progress — a thin rule that fills as the video loads */}
          <span className="block h-px w-44 bg-white/25">
            <span className="preloader-fill block h-full w-full origin-left scale-x-0 bg-white" />
          </span>
        </div>
      </div>
    </main>
  );
}
