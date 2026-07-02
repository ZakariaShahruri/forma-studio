"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "expo.out", duration: 1.4 },
      });

      tl.from(".hero-line span", {
        yPercent: 115,
        stagger: 0.08,
        duration: 1.2,
      })
        .from(
          ".hero-rule",
          { scaleX: 0, transformOrigin: "left", duration: 1.1 },
          "-=0.8"
        )
        .from(
          ".hero-meta > *",
          { y: 16, opacity: 0, stagger: 0.08, duration: 0.9 },
          "-=0.9"
        );

      // Subtle parallax drift of the wordmark as the page moves.
      gsap.to(".hero-word", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="top"
      className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[clamp(1.5rem,4vw,3rem)] pt-24"
    >
      {/* Monumental wordmark, edge to edge */}
      <div className="hero-word">
        <h1 className="display text-hero uppercase">
          <span className="hero-line block overflow-hidden">
            <span className="block">Forma</span>
          </span>
          <span className="hero-line block overflow-hidden">
            <span className="block pl-[0.06em] text-concrete">Studio</span>
          </span>
        </h1>
      </div>

      <hr className="hero-rule rule mt-[clamp(1.5rem,4vw,3rem)]" />

      {/* Meta row — quietly authoritative */}
      <div className="hero-meta mt-6 grid grid-cols-2 gap-y-6 md:grid-cols-4">
        <p className="label text-concrete">
          <span className="mb-2 block text-charcoal">Discipline</span>
          Architecture
          <br />
          Interior Design
        </p>
        <p className="label text-concrete">
          <span className="mb-2 block text-charcoal">Based</span>
          Copenhagen
          <br />
          Working globally
        </p>
        <p className="label text-concrete">
          <span className="mb-2 block text-charcoal">Since</span>
          Est. 2014
        </p>
        <p className="label max-w-[24ch] font-normal text-charcoal [text-transform:none] [letter-spacing:-0.01em]">
          A practice of restraint — proportion, material and light,
          arranged with intention.
        </p>
      </div>
    </section>
  );
}
