# Site-wide light/dark theme — design

## Context

The header's "Скачать" CTA is being replaced with a theme toggle. The user
wants it to actually work — a full light/dark theme, matching the already-
built system in `public/sp42-2016-vs-2026.html` (CSS custom properties,
`data-theme` attribute on `<html>`, localStorage persistence, a circular
sun/moon toggle button). Right now every color in `abr-move` is a literal
hex value in `tailwind.config.mjs` — there is no light theme anywhere in
the live component set.

Goal: make every color token theme-aware via CSS variables (dark is the
default/current look, light is new), swap the header CTA for a toggle,
and swap the two theme-inverted logo images already sitting unused in
`public/` (`logo-lockup.png`, dark-on-transparent, for light backgrounds)
in alongside `logo-lockup-white.png`.

## Architecture

Tailwind's `colors` config stops holding literal hex and instead holds
`var(--color-*)` references. `global.css` defines those variables twice:
once under `:root` (dark, current values — no visual change to existing
users) and once under `:root[data-theme="light"]` (new light values).
`data-theme` is set on `<html>` by a blocking inline script in
`Layout.astro`'s `<head>` (reads `localStorage`, defaults to `dark`, runs
before first paint — same technique as `sp42-2016-vs-2026.html`, prevents
a flash of the wrong theme). A toggle button in `Header.astro` flips the
attribute and persists the choice.

Every existing Tailwind utility class (`bg-base`, `text-gray-3`,
`border-line`, …) becomes theme-reactive automatically once its token's
CSS variable has a light override — **no class-name changes needed** for
any of them, and no component markup changes beyond the specific fixes
below.

## Token values

All dark values are today's existing hex (unchanged). Light values are
taken directly from `sp42-2016-vs-2026.html`'s `:root[data-theme="light"]`
block where a token maps 1:1 (five of them match our hex *exactly* in the
dark column too, confirming the two pages already share a palette:
`gray-2`↔`--muted`, `gray-3`↔`--muted-dim`, `accent`↔`--cyan`,
`accent-dim`↔`--accent-dim`, `gray-1`↔`--ink`). Tokens with no sp42
equivalent (`surface`, `elevated`, `gray-4`) get a light value graded to
preserve the same relative contrast step they have today.

| Token | Dark (current) | Light (new) |
|---|---|---|
| `base` | `#09090E` | `#F6F7FB` |
| `surface` | `#10121A` | `#FFFFFF` |
| `elevated` | `#181B27` | `#EEF0F6` |
| `line` | `#1C1F2E` | `#E1E4EE` |
| `line-light` | `#282D45` | `#CBD0E0` |
| `gray-1` | `#E2E4EF` | `#14161F` |
| `gray-2` | `#888BA8` | `#5B5F78` |
| `gray-3` | `#42466A` | `#8A8FA6` |
| `gray-4` | `#252840` | `#C3C7D6` |
| `accent` | `#22D3EE` | `#0C8599` |
| `accent-dim` | `#0C4A56` | `#CFF3F8` |
| `amber` | `#F5A524` | `#A9660A` |
| `emerald` | `#34D399` | `#0E8F63` |
| `rose` | `#FB5E7E` | `#C81E4A` |
| `violet` | `#A78BFA` | `#6D4FC4` |

`accent-glow` stays the static `rgba(34, 211, 238, 0.10)` it is today —
low-opacity enough to read fine as a faint wash on either background, no
light variant needed. Tailwind's built-in `white` (`#FFFFFF`) is left
untouched and literal — it's not becoming a theme token.

## The `text-white` → `text-gray-1` consolidation

The codebase currently uses two different "brightest text" colors
interchangeably: Tailwind's literal `white` (`#FFFFFF`) for most headings,
and our own `gray-1` (`#E2E4EF`, imperceptibly different from white) for
hover-emphasis states. Making `gray-1` the *only* one theme-reactive and
leaving `white` literal means these two need to stop being interchangeable:
every live-page use of `text-white` / `hover:text-white` /
`group-hover:text-white` becomes `text-gray-1` / `hover:text-gray-1` /
`group-hover:text-gray-1`. This is a mechanical rename confined to the
files actually rendered by `index.astro` today:

`Header.astro`, `Footer.astro`, `Hero.astro`, `About.astro`,
`Solutions.astro`, `ModuleCard.astro`, `News.astro`,
`YouTubeCarousel.astro`, `Downloads.astro`, `src/pages/index.astro`.

Dead/unwired components (`Blog.astro`, `Demo.astro`, `Stats.astro`,
`HeroDemo.astro`) are **not** touched — they render nowhere, theming them
now is pure YAGNI.

Two things stay literal `white` on purpose, not renamed:
- `Hero.astro`'s decorative background road-line SVG (`stroke="white"` at
  ~7% overall opacity) — purely ambient texture, invisible either way at
  that opacity, not worth a light-mode-specific treatment.
- The ЮMoney payment button in `index.astro`'s support modal
  (`bg-[#8448FF]`, `text-white`) — a third-party brand color block, not
  part of this site's palette, correct to stay fixed in both themes.

## `.btn-white` fix

`global.css`'s `.btn-white` (`bg-white text-base`, used once, in
`Solutions.astro`'s CTA banner) breaks under the new tokens: in light mode
`base` becomes near-white, so a literal white button would have
near-invisible text. Fix: change it to `bg-gray-1 text-base` instead of
`bg-white text-base`. In dark mode `gray-1` (`#E2E4EF`) reads as
essentially the same near-white pill it is today. In light mode `gray-1`
(`#14161F`) is near-black, giving a properly inverted, high-contrast
button — same visual *role* ("the loud neutral CTA") in both themes.

## Component-layer CSS updates (`global.css`)

Everything under `@layer components`/`@layer utilities` that currently
hardcodes a hex instead of using a Tailwind color token gets switched to
the matching `var(--color-*)`:
- `html { background-color; color }` (base/gray-1)
- `::selection`: currently `rgba(34, 211, 238, 0.2)`, a fixed cyan tint.
  A new variable pair carries the accent as an RGB triplet so alpha can
  still vary: `--color-accent-rgb: 34, 211, 238` (dark) /
  `12, 133, 153` (light); `::selection` becomes
  `background-color: rgba(var(--color-accent-rgb), 0.2)`.
- scrollbar colors (base/line/line-light)
- `.card-hover:hover` (border-color/background-color: line-light/surface
  equivalents, currently `#282D45`/`#10121A`)
- `.btn-accent` (`background-color`/hover `background-color` — accent/
  a lighter accent hover, `color: #09090E` becomes `color: var(--color-base)`
  since "base" is the correct on-accent contrast color in *both* themes —
  dark accent is bright cyan needing dark text, light accent is a darker
  teal needing light text, and `base` is dark-in-dark-theme/
  light-in-light-theme by construction)
- `.btn-outline` (`border-color`/`color` hover states — line-light/gray-1)

The one-off brand colors that stay literal: `.support-btn:hover
.heart-icon` (`#E53E6D`, a fixed "love" red, unrelated to the new
palette) and the ЮMoney purple noted above.

## Logo: dark/light swap

`Header.astro` and `Footer.astro` currently render a single
`logo-lockup-white.png` (light-colored, readable only on a dark
background — it would nearly disappear in light mode). Both switch to the
same two-image technique `sp42-2016-vs-2026.html` already uses: render
both `logo-lockup-white.png` (class `logo-for-dark`) and `logo-lockup.png`
(class `logo-for-light`, the dark-colored version), and toggle visibility
with a small CSS rule keyed off `[data-theme="light"]` — the same rule
added once in `global.css`, reused by both components.

## Header: toggle button replaces "Скачать"

The desktop-only (`hidden md:inline-flex`) `btn-accent` "Скачать" link in
`Header.astro` is removed. In its place: a small square icon button
(sun/moon SVG pair, one shown per theme via CSS, matching
`sp42-2016-vs-2026.html`'s `.theme-toggle` markup and behavior) — and
unlike the CTA it replaces, this button is **not** hidden on mobile
(`hidden md:inline-flex` dropped entirely) since it's icon-sized and a
mobile visitor needs it too. It sits between the desktop nav and the
mobile hamburger button, so it's visible at every breakpoint. The
existing "Скачать модули" button inside the mobile dropdown menu is
untouched — that's a separate, still-useful conversion CTA, not what the
user is replacing.

Clicking it flips `data-theme` on `<html>`, persists the choice to
`localStorage`, and updates the `<meta name="theme-color">` tag — ported
directly from `sp42-2016-vs-2026.html`'s toggle script.

## `Layout.astro`: blocking theme-init script

A small inline `<script>` (not `type="module"`, must run synchronously
before first paint) goes right after `<meta charset>`: reads
`localStorage.getItem('abr-move-theme')`, defaults to `'dark'` if unset
or invalid, sets `document.documentElement.setAttribute('data-theme',
theme)`. This is the same pattern `sp42-2016-vs-2026.html` uses (there,
keyed on `'sp42-theme'`); this site's key is `'abr-move-theme'` — separate
namespace, since these are different pages a visitor might have different
preferences for, and reusing sp42's key would let an unrelated page's
localStorage write silently dictate this one's initial theme.

## Out of scope

- Dead components (`Blog.astro`, `Demo.astro`, `Stats.astro`,
  `HeroDemo.astro`) are not themed — not rendered anywhere.
- `Hero.astro`'s decorative watermark SVG stays literal white (see above).
- The QR/ЮMoney modal's payment-brand purple button stays literal.
- No new pages, no content changes — this is a token/theming pass only.
