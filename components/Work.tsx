"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type Project = {
  index: string;
  title: string;
  type: string;
  location: string;
  year: string;
  video: string;
};

const PROJECTS: Project[] = [
  {
    index: "01",
    title: "Casa Lumen",
    type: "Private Residence",
    location: "Puglia, IT",
    year: "2023",
    video: "/videos/clip_1.mp4",
  },
  {
    index: "02",
    title: "Section House",
    type: "Extension",
    location: "Copenhagen, DK",
    year: "2022",
    video: "/videos/clip_2.mp4",
  },
  {
    index: "03",
    title: "The Quarry",
    type: "Cultural Pavilion",
    location: "Braga, PT",
    year: "2024",
    video: "/videos/clip_3.mp4",
  },
  {
    index: "04",
    title: "Atelier Grey",
    type: "Interior",
    location: "Antwerp, BE",
    year: "2021",
    video: "/videos/clip_4.mp4",
  },
];

export function Work() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels =
        gsap.utils.toArray<HTMLDivElement>(".project-panel");

      panels.forEach((panel) => {
        const media = panel.querySelector<HTMLElement>(".project-media");
        const video = panel.querySelector<HTMLVideoElement>("video");
        const caption = panel.querySelector<HTMLElement>(".project-caption");

        // Media reveal — a clean architectural wipe from the base line up.
        if (media) {
          gsap.from(media, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: { trigger: panel, start: "top 78%" },
          });
        }

        if (caption) {
          gsap.from(caption.children, {
            y: 20,
            opacity: 0,
            stagger: 0.06,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: panel, start: "top 72%" },
          });
        }

        // Slow scale drift within the frame while in view.
        if (media) {
          gsap.fromTo(
            media.querySelector("video"),
            { scale: 1.12 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }

        // Only play video while it is on screen.
        if (video) {
          ScrollTrigger.create({
            trigger: panel,
            start: "top 90%",
            end: "bottom 10%",
            onToggle: (self) => {
              if (self.isActive) {
                video.play().catch(() => {});
              } else {
                video.pause();
              }
            },
          });
        }
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section id="work" ref={root} className="py-[clamp(2rem,6vh,6rem)]">
      <div className="gutter mb-[clamp(2rem,6vw,4rem)] flex items-baseline justify-between">
        <span className="label text-concrete">(02) — Selected Work</span>
        <span className="label text-concrete">2021 — 2024</span>
      </div>

      <div className="flex flex-col gap-[clamp(4rem,12vh,10rem)]">
        {PROJECTS.map((p) => (
          <article key={p.index} className="project-panel gutter">
            {/* Caption row */}
            <div className="project-caption mb-5 flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <span className="label text-concrete">{p.index}</span>
              <h3 className="display text-title mr-auto uppercase">
                {p.title}
              </h3>
              <span className="label text-charcoal">{p.type}</span>
              <span className="label text-concrete">{p.location}</span>
              <span className="label text-concrete">{p.year}</span>
            </div>

            {/* Full-bleed media */}
            <div
              data-cursor="glass"
              className="project-media relative aspect-[16/10] w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-concrete)_22%,var(--color-white))] md:aspect-[16/8]"
            >
              <video
                className="h-full w-full object-cover"
                src={p.video}
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
