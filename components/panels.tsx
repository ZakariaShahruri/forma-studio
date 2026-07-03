"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "@/app/actions";

/* Shared panel content — rendered inside the pinned desktop experience
   and the normally-scrolled mobile layout. `animated` marks the variants
   whose accents (underline draw, count-up) are driven by GSAP on desktop;
   the mobile layout renders them settled. */

export const STATS = [
  { label: "Projects", value: 142 },
  { label: "Countries", value: 28 },
  { label: "Awards", value: 6 },
];

export const WORKS = [
  { name: "Casa Lumen", category: "Private Residence", year: "2023" },
  { name: "The Quarry", category: "Cultural Pavilion", year: "2024" },
  { name: "Atelier Grey", category: "Interior", year: "2021" },
];

const INITIAL: InquiryState = { status: "idle", message: "" };

export function NameContent() {
  return (
    <>
      <h1 className="display text-hero uppercase leading-[0.95]">
        <span className="block">Forma</span>
        <span className="block">Studio</span>
      </h1>
      <p className="label mt-8 text-white/95">
        Architecture &amp; Interior Design — Est. 1998
      </p>
    </>
  );
}

export function PhilosophyContent({ animated }: { animated: boolean }) {
  return (
    <>
      <h2 className="display text-title">We design spaces that endure.</h2>
      <span
        className={`mt-5 block h-px w-full bg-white/80 ${
          animated ? "draw-line scale-x-0" : ""
        }`}
      />
      <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-white/95">
        Forma works at the meeting point of architecture and interior — one
        continuous discipline, not two. We build slowly, precisely, and only
        what deserves to remain.
      </p>
    </>
  );
}

export function StatsContent({ animated }: { animated: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      {STATS.map((stat) => (
        <div key={stat.label}>
          <span className="label block text-white/95">{stat.label}</span>
          <span className="display mt-1 block text-display tabular-nums">
            {animated ? (
              <span className="stat-num" data-target={stat.value}>
                0
              </span>
            ) : (
              stat.value
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export function WorksContent() {
  return (
    <>
      <h2 className="display text-display uppercase">Selected Works</h2>
      <ul className="mt-8">
        {WORKS.map((work) => (
          <li
            key={work.name}
            className="flex items-baseline justify-between gap-6 border-t border-white/15 py-4"
          >
            <span className="display text-heading">{work.name}</span>
            <span className="label ml-auto text-white/95">{work.category}</span>
            <span className="label text-white/95">{work.year}</span>
          </li>
        ))}
      </ul>
      <a
        href="mailto:studio@formastudio.example?subject=Portfolio%20request"
        data-cursor="cta"
        className="label mt-8 inline-block text-white/95 transition-opacity duration-300 hover:opacity-60 [letter-spacing:0.18em]"
      >
        View All
      </a>
    </>
  );
}

export function ContactContent() {
  const [inquiry, formAction, pending] = useActionState(submitInquiry, INITIAL);

  return (
    <>
      <h2 className="display text-title">Start a project.</h2>

      {inquiry.status === "sent" ? (
        <p className="mt-8 text-base text-white/95">{inquiry.message}</p>
      ) : (
        <form action={formAction} className="mt-8">
          <div className="flex items-end gap-4">
            <input
              type="email"
              name="email"
              required
              placeholder="Your email"
              aria-label="Your email"
              className="w-full border-0 border-b border-white/40 bg-transparent py-2 text-base text-white outline-none transition-colors duration-300 placeholder:text-white/75 focus:border-white/80"
            />
            <button
              type="submit"
              disabled={pending}
              data-cursor="cta"
              className="label shrink-0 pb-2 text-white transition-opacity duration-300 hover:opacity-60 disabled:opacity-40"
            >
              {pending ? "Sending" : "Send"}
            </button>
          </div>
          {inquiry.status === "error" && (
            <p className="mt-3 text-sm text-white/95">{inquiry.message}</p>
          )}
        </form>
      )}

      <div className="mt-10 text-base text-white/95">
        <a
          href="mailto:studio@formastudio.example"
          data-cursor="cta"
          className="transition-colors duration-300 hover:text-white"
        >
          studio@formastudio.example
        </a>
        <br />
        Copenhagen
      </div>
    </>
  );
}
