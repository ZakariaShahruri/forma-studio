"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type State = "default" | "cta" | "text" | "glass";

/* Crosshair geometry — a drafting instrument's sight. Four hairline arms
   meeting at the pointer with a hollow centre. */
const ARM = 10; // arm length
const GAP = 4; // half-gap around the exact centre
const GLASS_GAP = 15; // spread when measuring a glass surface
const LINE = 1.5; // line weight — visible without losing precision

/* Elements whose hover means "reading": the crosshair becomes an I-beam. */
const TEXT_SELECTOR =
  "p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote, figcaption, label, input, textarea, span";

export function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;

    // Only for precise pointers — never hijack touch.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Hide the native cursor site-wide once we take over.
    document.documentElement.classList.add("has-custom-cursor");

    const cross = rootEl.querySelector<HTMLElement>(".cur-cross")!;
    const [armUp, armRight, armDown, armLeft] = Array.from(
      rootEl.querySelectorAll<HTMLElement>(".cur-arm")
    );
    const ibeam = rootEl.querySelector<HTMLElement>(".cur-ibeam")!;
    const [capTop, bar, capBottom] = Array.from(
      ibeam.querySelectorAll<HTMLElement>("div")
    );

    /* Lay the arms out around the hollow centre — a fine instrument,
       weighted just enough to be found instantly on any frame. */
    gsap.set(armUp, { width: LINE, height: ARM, x: -LINE / 2, y: -(GAP + ARM) });
    gsap.set(armDown, { width: LINE, height: ARM, x: -LINE / 2, y: GAP });
    gsap.set(armLeft, { height: LINE, width: ARM, y: -LINE / 2, x: -(GAP + ARM) });
    gsap.set(armRight, { height: LINE, width: ARM, y: -LINE / 2, x: GAP });
    gsap.set(ibeam, { opacity: 0 });

    /* Immediate tracking — no tween, no lag. Precision tools don't drift. */
    const setX = gsap.quickSetter(rootEl, "x", "px");
    const setY = gsap.quickSetter(rootEl, "y", "px");

    let lastX = -100;
    let lastY = -100;
    let visible = false;

    /* Size the I-beam from the hovered text so it reads as that type's own
       caret: bar height follows font-size, bar weight follows font-weight. */
    const fitIbeam = (el: Element) => {
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize) || 16;
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const h = Math.min(Math.max(size * 1.15, 14), 96);
      const w = weight >= 500 ? 2.5 : weight >= 400 ? 2 : 1.5;
      gsap.set(bar, { width: w, height: h, x: -w / 2, y: -h / 2 });
      gsap.set(capTop, { width: 8, height: 1.5, x: -4, y: -h / 2 });
      gsap.set(capBottom, { width: 8, height: 1.5, x: -4, y: h / 2 - 1.5 });
    };

    // ---- State machine -------------------------------------------------
    let state: State = "default";
    let textEl: Element | null = null;

    const spreadArms = (gap: number, duration: number, ease: string) => {
      gsap.to(armUp, { y: -(gap + ARM), duration, ease, overwrite: "auto" });
      gsap.to(armDown, { y: gap, duration, ease, overwrite: "auto" });
      gsap.to(armLeft, { x: -(gap + ARM), duration, ease, overwrite: "auto" });
      gsap.to(armRight, { x: gap, duration, ease, overwrite: "auto" });
    };

    const apply = (next: State, el: Element | null = null) => {
      if (next === state && el === textEl) return;

      if (next === "text" && el) fitIbeam(el);
      state = next;
      textEl = next === "text" ? el : null;

      const fast = reduce ? 0 : 0.22;

      // Crosshair ⇄ I-beam crossfade.
      gsap.to(cross, {
        opacity: next === "text" ? 0 : 1,
        duration: fast,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(ibeam, {
        opacity: next === "text" ? 1 : 0,
        duration: fast,
        ease: "power2.out",
        overwrite: "auto",
      });

      // Interactive: rotate 45° and contract — the sight locks on.
      gsap.to(cross, {
        rotation: next === "cta" ? 45 : 0,
        scale: next === "cta" ? 0.78 : 1,
        duration: reduce ? 0 : 0.3,
        ease: "power3.out",
        overwrite: "auto",
      });

      // Glass: the arms travel outward slowly, as if measuring the space.
      if (next === "glass") {
        spreadArms(GLASS_GAP, reduce ? 0 : 1.4, "power1.out");
      } else {
        spreadArms(GAP, reduce ? 0 : 0.45, "power3.out");
      }
    };

    const resolve = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return apply("default");
      const cta = target.closest('[data-cursor="cta"], a, button');
      if (cta) return apply("cta");
      const text = target.closest(TEXT_SELECTOR);
      if (text && (text.textContent ?? "").trim().length > 0)
        return apply("text", text);
      if (target.closest('[data-cursor="glass"]')) return apply("glass");
      apply("default");
    };

    const onMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      setX(lastX);
      setY(lastY);
      if (!visible) {
        visible = true;
        gsap.to(rootEl, { opacity: 1, duration: 0.25, ease: "power2.out" });
      }
      resolve(e.target);
    };

    const onOver = (e: PointerEvent) => resolve(e.target);

    /* Panels fade in and out beneath a stationary pointer while scrolling —
       re-read what is actually under the crosshair. */
    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        if (visible) resolve(document.elementFromPoint(lastX, lastY));
      });
    };

    const onLeave = () => {
      visible = false;
      gsap.to(rootEl, { opacity: 0, duration: 0.2, ease: "power2.out" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      gsap.killTweensOf([rootEl, cross, ibeam, armUp, armDown, armLeft, armRight, bar, capTop, capBottom]);
    };
  }, []);

  return (
    <div
      aria-hidden
      ref={rootRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] -ml-[60px] -mt-[60px] h-[120px] w-[120px] opacity-0 [will-change:transform] [filter:drop-shadow(0_0_2px_rgba(0,0,0,0.55))_drop-shadow(0_1px_4px_rgba(0,0,0,0.3))]"
    >
      {/* The instrument is anchored at the centre of a real 120×120 box, so
          no state (crosshair, glass spread, tallest I-beam) ever extends
          past the element's bounds — filtered zero-size roots get their
          overflowing children clipped in some engines (Safari). */}
      {/* Crosshair — four arms around a hollow centre */}
      <div className="cur-cross absolute left-1/2 top-1/2">
        <div className="cur-arm absolute left-0 top-0 bg-white" />
        <div className="cur-arm absolute left-0 top-0 bg-white" />
        <div className="cur-arm absolute left-0 top-0 bg-white" />
        <div className="cur-arm absolute left-0 top-0 bg-white" />
      </div>
      {/* I-beam — sized to the hovered text */}
      <div className="cur-ibeam absolute left-1/2 top-1/2">
        <div className="absolute left-0 top-0 bg-white" />
        <div className="absolute left-0 top-0 bg-white" />
        <div className="absolute left-0 top-0 bg-white" />
      </div>
    </div>
  );
}
