"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export function Footer() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".contact-word span", {
        yPercent: 115,
        stagger: 0.06,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <footer
      id="contact"
      ref={root}
      className="gutter flex min-h-[90svh] flex-col justify-between bg-charcoal py-[clamp(2rem,6vw,4rem)] text-white"
    >
      <div className="flex items-baseline justify-between pt-8">
        <span className="label text-concrete">(04) — Contact</span>
        <span className="label text-concrete">55.6761° N, 12.5683° E</span>
      </div>

      {/* Monumental call to work together */}
      <a
        href="mailto:studio@formastudio.example"
        className="contact-word display text-hero block uppercase transition-opacity duration-500 hover:opacity-60"
        aria-label="Email FORMA STUDIO"
      >
        <span className="block overflow-hidden">
          <span className="block">Let&rsquo;s</span>
        </span>
        <span className="block overflow-hidden">
          <span className="block text-concrete">Build</span>
        </span>
      </a>

      {/* Contact grid */}
      <div className="mt-16 grid grid-cols-2 gap-y-8 md:grid-cols-4">
        <div className="label text-concrete">
          <span className="mb-2 block text-white">General</span>
          <a
            href="mailto:studio@formastudio.example"
            className="[text-transform:none] hover:text-white"
          >
            studio@formastudio.example
          </a>
        </div>
        <div className="label text-concrete">
          <span className="mb-2 block text-white">New Work</span>
          <a
            href="mailto:new@formastudio.example"
            className="[text-transform:none] hover:text-white"
          >
            new@formastudio.example
          </a>
        </div>
        <div className="label text-concrete">
          <span className="mb-2 block text-white">Studio</span>
          Refshalevej 163A
          <br />
          1432 Copenhagen K
        </div>
        <div className="label text-concrete">
          <span className="mb-2 block text-white">Elsewhere</span>
          <span className="[text-transform:none]">Instagram — LinkedIn</span>
        </div>
      </div>

      <div className="mt-16 flex items-center justify-between border-t border-[color-mix(in_srgb,var(--color-concrete)_35%,transparent)] pt-6">
        <span className="label text-concrete">Forma Studio</span>
        <span className="label text-concrete">
          &copy; {new Date().getFullYear()} — All rights reserved
        </span>
      </div>
    </footer>
  );
}
