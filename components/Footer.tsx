"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
];

/* The only thing outside the pinned video experience. It sits below the
   pin-spacer and fades in as it enters the viewport. */
export function Footer() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: reduce ? 0.2 : 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 92%" },
        }
      );
    }, root);

    // The pin-spacer is created after mount; make sure our start position is
    // measured against the final layout.
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={root}
      className="gutter grid h-20 grid-cols-3 items-center border-t border-white/10 bg-charcoal text-white"
    >
      <span className="label text-left text-white">Forma Studio</span>

      <span className="label text-center text-concrete">
        Copenhagen — Est. 1998
      </span>

      <div className="flex items-center justify-end gap-8">
        {SOCIALS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            data-cursor="cta"
            className="label text-white transition-opacity duration-300 hover:opacity-50"
          >
            {social.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
