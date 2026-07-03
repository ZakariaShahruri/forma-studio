# FORMA STUDIO

Portfolio site for a boutique architecture and interior design studio.
The entire site is a single full-viewport experience: a house walkthrough
video driven frame-by-frame by scroll, with glassmorphism panels surfacing
at fixed points along the way. Three colours, two typefaces, and motion
that behaves like a precision instrument.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — theme tokens defined in `app/globals.css` via `@theme`
- **GSAP 3** — `ScrollTrigger` pins the viewport and scrubs the video,
  `quickTo` drives the cursor. (GSAP is fully free as of 2025.)
- **Server Action** (`app/actions.ts`) handles the contact form.

## The scroll experience

On first load a **preloader** holds the screen: the exterior still
(`public/images/preloader.jpg`) the walkthrough opens on, the studio name,
and a thin rule that fills with real video buffering progress. Scroll is
locked until enough of the video's head has buffered, then the preloader
fades onto the identical first frame.

`components/Experience.tsx` pins the viewport for **600vh** of scroll.
Scroll position maps to a progress value in `[0, 1]` that drives everything:

- **Video scrub** — `/public/videos/walkthrough.mp4` never plays;
  `currentTime` is tweened toward `progress × duration` on every scroll
  update, so scrolling forward advances the walkthrough and scrolling
  back retreats it.
- **Panels** — five `.glass` panels each own a progress window
  (`PANEL_RANGES`). Windows never overlap, so no two panels are visible
  at once. Panels fade in/out on entering/leaving their window; panel 2
  draws an underline, panel 3 counts its stats up from zero.
- **Progress line** — a hairline on the right edge fills with progress.
- **Scroll hint** — pulses at the start, fades permanently once the
  user moves.

The navbar scrolls to fractions of the pin length (`SCROLL_TARGETS`)
rather than to anchors, since the document is one pinned track.

## Design system

Three colours only. The glass panels are Apple-style material —
`blur(20px) saturate(180%)`, hairline `rgba(255,255,255,0.15)` border,
inset-only shadows — and adapt to the video behind them: white glass
(`rgba(255,255,255,0.08)`) over dark scenes, dark glass
(`rgba(0,0,0,0.25)`) over light ones. Brightness is sampled from the
video frame under the active panel (tiny canvas, luminance average,
hysteresis at 0.36/0.42 so mid-tones never flicker) — the flip point is
where white text would stop passing WCAG AA. All panel text carries a
soft text-shadow for legibility on any frame.

| Token             | Value     | Use                        |
| ----------------- | --------- | -------------------------- |
| `--color-white`   | `#fafaf8` | Warm white — type on video |
| `--color-charcoal`| `#111110` | Deep charcoal — base       |
| `--color-concrete`| `#8a8a85` | Raw concrete — labels      |

**Type**
- **PP Editorial New** — display headings (Ultralight 200 / Regular 400).
- **Neue Montreal** — all UI text, captions, labels, body (Regular / Medium).

Both are loaded locally via `next/font/local` (`app/fonts.ts`).

## Structure

```
app/
  layout.tsx      # fonts, metadata, mounts <Cursor /> + <Navbar />
  page.tsx        # renders <Experience />
  actions.ts      # Server Action for the project-inquiry form
  globals.css     # design tokens, base styles, .glass, cursor hiding
  fonts.ts        # next/font/local declarations
  fonts/          # PP Editorial New + Neue Montreal files
components/
  Experience.tsx  # pinned scroll track: video scrub, panels, progress line
  Navbar.tsx      # transparent → frosted on scroll; scrolls to track positions
  Cursor.tsx      # custom cursor (see below)
public/videos/    # walkthrough.mp4 — the scroll-driven house walkthrough
public/images/    # preloader.jpg — exterior still shown while buffering
```

## Custom cursor

`components/Cursor.tsx` replaces the native cursor with a fine
**crosshair** — four hairline arms around a hollow centre, like a
drafting instrument. Position tracking is immediate (no easing, no lag).

- **Interactive** (`[data-cursor="cta"]`, links, buttons) — the sight
  rotates 45° and contracts.
- **Text** — becomes a thin I-beam sized from the hovered type: bar
  height follows font-size, bar weight follows font-weight.
- **Glass** (`[data-cursor="glass"]`) — the arms travel outward slowly,
  as if measuring the surface.

Fine pointers only; `prefers-reduced-motion` makes state changes instant.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Notes

- **Fonts** — PP Editorial New and Neue Montreal (Pangram Pangram) are free
  for personal use. Confirm proper licensing before any commercial deployment.
- **Video** — `walkthrough.mp4` is scrubbed by scroll, so seek performance
  depends on keyframe density. If scrubbing ever feels steppy, re-encode
  with a short GOP (e.g. `ffmpeg … -g 8`).
- The inquiry form's Server Action currently logs to the server; wire it to
  a mailer or CRM before launch.
