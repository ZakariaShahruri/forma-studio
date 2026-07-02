# FORMA STUDIO

Portfolio site for a boutique architecture and interior design studio.
Ultra-minimal, built around restraint — three colours, two typefaces, and
motion that behaves like a precision instrument. The brief was that it should
feel like the studio built it themselves.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — theme tokens defined in `app/globals.css` via `@theme`
- **GSAP 3** — `ScrollTrigger` for reveals, `Flip` for layout morphs, `quickTo`
  for the cursor. (GSAP is fully free as of 2025, including all plugins.)

## Design system

Three colours only. No gradients, no shadows, no decorative elements.

| Token             | Value     | Use                        |
| ----------------- | --------- | -------------------------- |
| `--color-white`   | `#fafaf8` | Warm white — base surface  |
| `--color-charcoal`| `#111110` | Deep charcoal — ink        |
| `--color-concrete`| `#8a8a85` | Raw concrete — mid-tone    |

**Type**
- **PP Editorial New** — display headings (Ultralight 200 / Regular 400).
  Monumental and optical at hero sizes.
- **Neue Montreal** — all UI text, captions, labels, body (Regular / Medium).
  Precise and neutral. `12px` for nav and labels.

Both are loaded locally via `next/font/local` (`app/fonts.ts`). The fluid
display scale (`--text-hero` → `--text-label`) lives in `app/globals.css`.

## Structure

```
app/
  layout.tsx      # fonts, metadata, mounts <Cursor /> + <Navbar />
  page.tsx        # section composition
  globals.css     # design tokens, base styles, cursor hiding
  fonts.ts        # next/font/local declarations
  fonts/          # PP Editorial New + Neue Montreal files
components/
  Navbar.tsx      # transparent → frosted on scroll; mobile slide-in menu
  Hero.tsx        # monumental wordmark, masked line-reveal + parallax
  Statement.tsx   # scrubbed line-by-line reveal
  Work.tsx        # four project panels; clip-path wipe + in-view playback
  Approach.tsx    # capabilities index, list ⇄ grid via GSAP Flip
  Footer.tsx      # charcoal contact section
  Cursor.tsx      # custom cursor (see below)
lib/
  gsap.ts         # registers ScrollTrigger + Flip once, client-side
public/videos/    # clip_1–4.mp4 project media
```

## Custom cursor

`components/Cursor.tsx` replaces the native cursor with a two-part instrument:

- an **exact dot** that tracks the pointer with no lag, and
- a **ring** that trails with an elastic settle (`elastic.out`).

State is resolved by walking up from the hovered element:

- `[data-cursor="glass"]` — ring **expands** to frame the surface
  (navbar, project media).
- `[data-cursor="cta"]` — cursor **morphs into an arrow**
  (links, buttons, mailto CTAs).

It only activates for `(pointer: fine)` devices — touch keeps the native
cursor. The native cursor is hidden via a JS-set `.has-custom-cursor` class, so
if JS never runs the cursor is preserved. `prefers-reduced-motion` drops the
elastic lag.

To make a new element interactive, add `data-cursor="glass"` or
`data-cursor="cta"`.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Notes

- **Fonts** — PP Editorial New and Neue Montreal (Pangram Pangram) are free for
  personal use. Confirm proper licensing before any commercial deployment.
- The project videos are committed directly to the repo; consider Git LFS if
  they grow or change often.
