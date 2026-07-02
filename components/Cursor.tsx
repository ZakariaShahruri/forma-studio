"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type State = "default" | "glass" | "cta";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const arrow = arrowRef.current;
    if (!dot || !ring || !arrow) return;

    // Only for precise pointers — never hijack touch.
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Hide the native cursor site-wide once we take over.
    document.documentElement.classList.add("has-custom-cursor");

    // Centre every layer on the pointer coordinate.
    gsap.set([dot, ring, arrow], { xPercent: -50, yPercent: -50 });
    gsap.set(arrow, { scale: 0.4, opacity: 0 });

    // Ring trails with an elastic settle; the dot + arrow track exactly.
    const ringX = gsap.quickTo(ring, "x", {
      duration: reduce ? 0.15 : 0.7,
      ease: reduce ? "power3" : "elastic.out(1, 0.75)",
    });
    const ringY = gsap.quickTo(ring, "y", {
      duration: reduce ? 0.15 : 0.7,
      ease: reduce ? "power3" : "elastic.out(1, 0.75)",
    });

    let visible = false;
    const reveal = () => {
      if (visible) return;
      visible = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.35, ease: "power2.out" });
    };

    const onMove = (e: PointerEvent) => {
      reveal();
      // Exact tracking — the instrument tip.
      gsap.set([dot, arrow], { x: e.clientX, y: e.clientY });
      ringX(e.clientX);
      ringY(e.clientY);
    };

    // ---- Interaction states -------------------------------------------
    // Resting scale of each layer per state; press scales these down a touch.
    const REST: Record<State, { dot: number; ring: number; arrow: number }> = {
      default: { dot: 1, ring: 1, arrow: 0.4 },
      glass: { dot: 0.65, ring: 2.7, arrow: 0.4 },
      cta: { dot: 0, ring: 0, arrow: 1 },
    };

    let state: State = "default";
    let pressed = false;

    const render = (next: State) => {
      const press = pressed ? 0.85 : 1;
      const r = REST[next];

      gsap.to(dot, {
        scale: r.dot * press,
        opacity: next === "cta" ? 0 : 1,
        duration: 0.3,
        ease: "power3.out",
      });
      gsap.to(ring, {
        scale: r.ring * press,
        opacity: next === "cta" ? 0 : 1,
        duration: next === "glass" ? 0.45 : 0.4,
        ease: "power3.out",
      });
      gsap.to(arrow, {
        scale: r.arrow * press,
        opacity: next === "cta" ? 1 : 0,
        duration: next === "cta" ? 0.4 : 0.2,
        ease: next === "cta" ? "back.out(2.2)" : "power3.out",
      });
    };

    const apply = (next: State) => {
      if (next === state) return;
      state = next;
      render(state);
    };

    const resolve = (target: EventTarget | null): State => {
      if (!(target instanceof Element)) return "default";
      // CTA wins when nested inside a glass surface (it's the inner intent).
      if (target.closest('[data-cursor="cta"]')) return "cta";
      if (target.closest('[data-cursor="glass"]')) return "glass";
      return "default";
    };

    const onOver = (e: PointerEvent) => apply(resolve(e.target));

    // Tactile press feedback — re-render the current state at pressed scale.
    const onDown = () => {
      pressed = true;
      render(state);
    };
    const onUp = () => {
      pressed = false;
      render(state);
    };

    const onLeave = () =>
      gsap.to([dot, ring, arrow], { opacity: 0, duration: 0.25, ease: "power2.out" });
    const onEnter = () => {
      visible = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Ring — elastic lag */}
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-10 w-10 rounded-full border border-white opacity-0 mix-blend-difference [will-change:transform]"
      />
      {/* Dot — exact */}
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-[6px] w-[6px] rounded-full bg-white opacity-0 mix-blend-difference [will-change:transform]"
      />
      {/* Arrow — CTA morph */}
      <div
        ref={arrowRef}
        className="absolute left-0 top-0 opacity-0 mix-blend-difference [will-change:transform]"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="square"
        >
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </div>
    </div>
  );
}
