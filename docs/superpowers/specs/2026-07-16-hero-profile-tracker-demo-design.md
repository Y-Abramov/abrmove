# Hero Profile Tracker demo — design

## Context

Landing page hero (`src/components/Hero.astro`) is currently a single-column,
text-only block: tag, headline, subtitle, two CTAs, a stats strip, all over a
faint decorative grid + giant watermark logo + faint road SVG. It communicates
the product ("Инструменты для проектирования дорог в Topomatic Robur") but
never shows it. The design reference (`Референс.png`, project root) pairs the
same copy with a live-looking HUD panel from the actual Profile Tracker
module (chainage, elevations, slope, a moving cursor).

Goal: replace the passive decoration with a small interactive demo of the
real product — the thing that makes this hero specific to ABR|MOVE instead of
a generic SaaS hero.

## Layout

Hero content grid becomes two columns at `lg` breakpoint and above:

```
grid lg:grid-cols-[1fr_480px] lg:gap-12 items-center
```

- Left column: existing tag/headline/subtitle/CTAs/stats-strip, unchanged.
- Right column: new `HeroDemo.astro` component (see below). `hidden lg:block`
  — not rendered at all below 1024px viewport width.
- The full-width giant watermark logo (`Hero.astro:23-26`) and the faint road
  SVG (`Hero.astro:12-21`) are removed from the left/full-width area. A
  much dimmer version of the road SVG may sit behind the HeroDemo panel only,
  as ambient texture, opacity ≤ 0.04.
- Below `lg`, hero returns to exactly its current single-column look — no
  new component in the DOM, no extra weight on mobile.

## `HeroDemo.astro` component

New file: `src/components/HeroDemo.astro`, imported and rendered only from
`Hero.astro`.

**Chrome:**
- Bordered panel, `border border-line bg-surface`.
- Header strip: mono label `ABR | Profile Tracker` (`.section-label`-style,
  smaller) + a live-status pill on the right: a pulsing `accent` dot +
  `Слежение включено` in mono, 10px, uppercase, tracked — same visual
  language as the existing hero tag chip (`Hero.astro:33-36`).

**Plot area:**
- SVG, viewBox roughly `0 0 440 260`.
- Background: reuse `bg-grid-fine` pattern (as a `<pattern>` inside the SVG,
  or an absolutely-positioned div behind the SVG using the existing Tailwind
  utility — component choice at build time, whichever keeps markup simpler).
- Two polylines:
  - "Существующая" (ground): jagged/noisy, stroke `gray-3` (#42466A), thin.
  - "Проектная" (design): smooth, stroke `accent` (#22D3EE), slightly
    thicker, drawn on top.
  - Both are static SVG paths — hand-authored point arrays, not computed
    from real project data. This is illustrative, not a real dataset.
- A vertical dashed cursor line (`stroke-dasharray`, `gray-2`) plus a small
  filled circle marker at the point where the cursor intersects the design
  curve.

**Readout:**
- Small floating box near the marker (or docked bottom-right of the plot —
  whichever avoids clipping at the SVG edges), `bg-elevated` background,
  `border-line` border, mono text, matching the density of the reference's
  readout card:
  - `ПК <chainage>` (e.g. `ПК 122+37`)
  - `Отметка проекта` — design elevation, m
  - `Отметка существующая` — ground elevation, m
  - `Рабочая отметка` — signed difference, m
  - `Уклон, ‰` — local slope
  - `Расстояние до ПК` — distance to nearest round station, m
- All values are derived deterministically from the marker's x-position
  along the authored point arrays (interpolation + local slope from
  neighboring points) — synthetic but internally consistent, so numbers
  never contradict each other or jump erratically.

## Motion

- Idle state: marker auto-drifts left→right along the design curve on a
  loop, ~8s per pass, eased (`cubic-bezier` matching the `.reveal` easing
  already in `global.css`), pause briefly at each end before reversing or
  restarting.
- Hover state (pointer devices only): marker follows the horizontal mouse
  position, clamped to the plot's x-range; auto-drift pauses while hovered
  and resumes a few hundred ms after pointer leave.
- `prefers-reduced-motion: reduce`: no auto-drift. Marker sits at a fixed
  mid-point. Hover-follow still works (it's user-driven, not ambient
  motion).
- Implementation: vanilla `<script>` in `HeroDemo.astro`, `requestAnimationFrame`
  loop, no dependencies. Numbers update via direct DOM text updates, not
  framework reactivity (matches the rest of the site — plain Astro +
  vanilla JS, see `Layout.astro`'s existing reveal-observer script).

## Accessibility

- Whole `HeroDemo` root gets `aria-hidden="true"` — it's a decorative
  product preview, not content someone needs read out; the real product
  description already exists as text in the left column.
- No interactive controls, so no focus/tab-order concerns.
- Respects `prefers-reduced-motion` as specified above.

## Out of scope (this change)

- No real project data — numbers are illustrative.
- No mobile/tablet variant — hidden below `lg`.
- No changes to other hero content (copy, CTAs, stats strip).
