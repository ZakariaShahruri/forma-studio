"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LINES = [
  "We believe a building",
  "should say only what",
  "is necessary — and",
  "say it precisely.",
];

export function Statement() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".statement-line", {
        opacity: 0.12,
        stagger: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
          end: "bottom 65%",
          scrub: true,
        },
      });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="studio"
      ref={root}
      className="gutter py-[clamp(6rem,16vh,14rem)]"
    >
      <span className="label mb-[clamp(2rem,6vw,4rem)] block text-concrete">
        (01) — The Studio
      </span>
      <p className="display text-display max-w-[16ch]">
        {LINES.map((line) => (
          <span key={line} className="statement-line block">
            {line}
          </span>
        ))}
      </p>
    </section>
  );
}
