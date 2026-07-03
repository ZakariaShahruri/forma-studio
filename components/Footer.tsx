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

    const ctx = gsap.context(() => {
      /* Scrubbed rather than one-shot: the fade tracks the footer's entry
         below the released pin exactly, and reverses smoothly if the user
         scrolls back up into the walkthrough. Opacity only — a y-drift on
         the trigger itself would stretch the document and push the scrub's
         end past the reachable scroll range. */
      gsap.fromTo(
        root.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            /* Only the footer's own height of scroll exists after the pin,
               so the fade must complete exactly when the document ends. */
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
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
