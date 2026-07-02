"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, Flip } from "@/lib/gsap";

const CAPABILITIES = [
  "Architecture",
  "Interior Design",
  "Master Planning",
  "Adaptive Reuse",
  "Furniture",
  "Art Direction",
];

type View = "index" | "grid";

export function Approach() {
  const container = useRef<HTMLUListElement>(null);
  const root = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("index");

  // Animate the reflow between the two layouts with Flip.
  useEffect(() => {
    if (!container.current) return;
    const state = Flip.getState(container.current.children);
    container.current.dataset.view = view;
    Flip.from(state, {
      duration: 0.7,
      ease: "power3.inOut",
      stagger: 0.03,
      absolute: true,
    });
  }, [view]);

  // Reveal on scroll.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".capability", {
        y: 24,
        opacity: 0,
        stagger: 0.06,
        duration: 0.9,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="approach"
      ref={root}
      className="gutter py-[clamp(6rem,14vh,12rem)]"
    >
      <div className="mb-[clamp(2rem,6vw,4rem)] flex items-baseline justify-between">
        <span className="label text-concrete">(03) — Approach</span>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setView("index")}
            data-cursor="cta"
            className={`label transition-opacity duration-300 ${
              view === "index" ? "text-charcoal" : "text-concrete hover:opacity-70"
            }`}
          >
            Index
          </button>
          <span className="label text-concrete">/</span>
          <button
            type="button"
            onClick={() => setView("grid")}
            data-cursor="cta"
            className={`label transition-opacity duration-300 ${
              view === "grid" ? "text-charcoal" : "text-concrete hover:opacity-70"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      <ul
        ref={container}
        data-view={view}
        className="group flex flex-col data-[view=grid]:grid data-[view=grid]:grid-cols-2 data-[view=grid]:gap-x-8 md:data-[view=grid]:grid-cols-3"
      >
        {CAPABILITIES.map((cap, i) => (
          <li
            key={cap}
            className="capability flex items-baseline gap-4 border-t border-[color-mix(in_srgb,var(--color-concrete)_35%,transparent)] py-5 group-data-[view=grid]:flex-col group-data-[view=grid]:gap-2 group-data-[view=grid]:py-8"
          >
            <span className="label text-concrete">0{i + 1}</span>
            <span className="display text-heading uppercase">{cap}</span>
          </li>
        ))}
      </ul>

      <p className="label mt-[clamp(3rem,8vw,5rem)] max-w-[52ch] font-normal leading-relaxed text-charcoal [letter-spacing:-0.01em] [text-transform:none]">
        We take a small number of projects each year, working closely with
        every client from first sketch to final detail. Restraint is not the
        absence of ideas — it is the discipline of keeping only the right ones.
      </p>
    </section>
  );
}
