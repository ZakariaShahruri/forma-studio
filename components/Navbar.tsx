"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { label: "Work", href: "#work" },
  { label: "Studio", href: "#studio" },
  { label: "Approach", href: "#approach" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        data-cursor="glass"
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled
            ? "border-b border-[color-mix(in_srgb,var(--color-concrete)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_72%,transparent)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="gutter flex h-16 items-center justify-between">
          {/* Studio mark — small caps, no icon */}
          <a
            href="#top"
            data-cursor="cta"
            className="label text-charcoal transition-opacity duration-300 hover:opacity-60"
            aria-label="FORMA STUDIO — home"
          >
            Forma Studio
          </a>

          {/* Desktop links */}
          <ul className="hidden items-center gap-10 md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  data-cursor="cta"
                  className="label text-charcoal transition-opacity duration-300 hover:opacity-50"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile trigger — a single minimal word, no hamburger clutter */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-cursor="cta"
            className="label text-charcoal md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            Menu
          </button>
        </nav>
      </header>

      {/* Mobile slide-in menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[60] md:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-charcoal/20 transition-opacity duration-500 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel */}
        <div
          className={`gutter absolute inset-y-0 right-0 flex w-[78%] max-w-sm flex-col justify-between bg-white py-6 transition-transform duration-500 [transition-timing-function:var(--ease-editorial)] ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="label text-concrete">Forma Studio</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              data-cursor="cta"
              className="label text-charcoal"
            >
              Close
            </button>
          </div>

          <ul className="flex flex-col gap-2">
            {LINKS.map((link, i) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  data-cursor="cta"
                  className="display block text-[15vw] leading-[1.05] text-charcoal transition-opacity duration-300 hover:opacity-50"
                >
                  {link.label}
                  <sup className="font-ui align-super text-[0.9rem] text-concrete">
                    0{i + 1}
                  </sup>
                </a>
              </li>
            ))}
          </ul>

          <div className="label text-concrete">
            Est. 2014 — By appointment
          </div>
        </div>
      </div>
    </>
  );
}
