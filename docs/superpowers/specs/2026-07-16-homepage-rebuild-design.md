# Homepage rebuild — design

## Context

The live page (`src/pages/index.astro`) is a minimal "site under construction"
stub: logo, tagline, a "Сайт в разработке" badge, two CTAs, a flat
dynamically-fetched module list, and a 3-icon footer. Separately,
`src/components/` holds a fully-built, already-approved component set
(`Header`, `Hero`, `About`, `Solutions`, `Stats`, `Demo`, `Downloads`, `Blog`,
`Footer`) that is never imported anywhere — dead code matching the reference
design the user likes. A content collection (`src/content.config.ts`, one
real post under `src/content/blog/`) is also unused.

Goal: replace the stub with a real homepage built from the existing
component set, reorganized per the user's requested structure, with two new
sections (News, YouTube) and two modified ones (About, Solutions).

The previously-planned `HeroDemo` HUD widget (see
`2026-07-16-hero-profile-tracker-demo-design.md`) is explicitly excluded from
this page — the component stays on disk, unused, for a future non-homepage
placement.

## Page composition

`src/pages/index.astro` renders, in order:

1. `Header` (nav) — unchanged except one label/href swap (see below).
2. `Hero` — used as-is (headline/subtitle/CTAs/stats-strip). The current
   stub's "Сайт в разработке" badge and inline logo hero are dropped
   entirely; this is a real page now, not a construction notice.
3. `About` ("О проекте") — modified: right column's support block is
   replaced with two CTAs (see below). Everything else (identity, bio, stack
   tags, stats grid) is unchanged.
4. `Solutions` ("Модули") — modified: the flat 5-card grid becomes two
   labeled sub-groups, "Topomatic Robur" and "Autodesk Civil 3D" (see below).
5. `News` ("Новости") — **new component**, backed by a **new content
   collection** `src/content/news`, empty-state-ready (no seed content).
6. `YouTubeCarousel` — **new component**, three "coming soon" placeholder
   cards, no fabricated video data.
7. `Downloads` ("Скачать") — used as-is.
8. `Footer` — modified: adds a "Поддержать автора" trigger to the
   Telegram/GitHub/VK/Email row, wired to the existing QR/ЮMoney modal.

The modal (`#qr-modal`) and its open/close script currently living in
`index.astro` are kept, relocated to sit alongside the new composition, and
re-pointed at the footer's new button id (the old hero support button that
triggered it is gone along with the stub hero).

The old build-time `fetch()` of `catalog.json` from
`raw.githubusercontent.com` and its flat module-list markup are deleted from
`index.astro` — modules are now the static list already living in
`Solutions.astro`, per the user's explicit choice.

## `Header` change

`navItems` in `src/components/Header.astro`: the `{ label: 'Блог', href:
'#blog' }` entry becomes `{ label: 'Новости', href: '#news' }`. No other
changes — `Header` is otherwise wired in unmodified.

## `About` change

The right column's "Support block" (`src/components/About.astro`, the `<div
class="flex-1 p-8 ...">` containing the "Поддержать автора" heading and its
two `<a class="btn-outline">` links) is replaced with a shorter block: one
line of supporting copy plus two CTAs — **Модули** (`href="#solutions"`,
`btn-accent`) and **Подробнее** (`href="https://github.com/Y-Abramov"`,
external, `btn-outline`, opens in a new tab). No dedicated "about" page
exists, so "Подробнее" points at the developer's GitHub profile rather than
a page that doesn't exist.

Everything else in `About.astro` — avatar/identity block, Robur Expert
badge, the two bio paragraphs, stack tags, and the stats grid (`10+ / 50+ /
5`, stacked above the block being replaced, same right column) — is
unchanged. This stats grid is the "Stats" content the user's approved page
order folds into About instead of keeping `Stats.astro` as its own section.

## `Solutions` change

The module data (name/desc/platform/icon/href) is unchanged — same 5
modules. The render changes from one flat grid to two labeled groups:

- **Topomatic Robur**: RoadStyle, Profile Tracker, Model Manager, Width
  Import.
- **Autodesk Civil 3D**: Slab Designer, Width Import.

Width Import (platform: "Robur / Civil 3D") appears in both groups — it
genuinely serves both, and 5 modules is too few to justify a third
"cross-platform" group or interactive tab-switcher. Each group gets its own
mono-label sub-heading above its own grid (same card styling as today,
same 3-column layout for Robur's 4 cards → likely 2-col on that row given
the count, 2-column for Civil's 2 cards). The section's intro copy ("Полные
инструменты для работы в Robur") is reworded to mention both platforms
since the section is no longer Robur-only framing.

## `News` — new

**Content collection** (`src/content.config.ts`, add alongside the existing
`blog` collection):

```ts
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    link: z.string().url().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog, news };
```

No seed files are added under `src/content/news/` — the directory starts
empty. This is deliberate: the user will write real news items later.

**Component** `src/components/News.astro`: same visual language as
`Blog.astro` (section label, dated card list). Fetches the `news`
collection, filters `draft`, sorts by date descending. If the (filtered)
list is empty, renders a single quiet line — "Здесь скоро появятся новости
о новых модулях и обновлениях." — instead of an empty section. Section
`id="news"` (this is what `Header`'s new nav entry points at).

**JSON endpoint** `src/pages/news.json.ts`: an Astro API route returning the
same collection as JSON (title/date/summary/link), sorted the same way,
`draft` items excluded. This is what makes `abrmove.ru/news.json` — the URL
the user says other tooling (their module-library app) already expects —
real and backed by the same source of truth as the on-page News section.

## `YouTubeCarousel` — new

`src/components/YouTubeCarousel.astro`, section `id="youtube"`. Three cards
in a row (horizontal scroll below `sm`, static 3-column grid at `sm` and
up), each: a muted thumbnail-shaped placeholder (border + play-icon glyph,
no real image), a "Скоро" (coming soon) mono label, no fabricated title or
link — these are not real videos standing in as fake ones, they're an
honest "not yet published" state. A code comment documents the shape a real
entry should take (`title`, `youtubeId`, `thumbnail`) so swapping in real
content later is a data change, not a markup change.

## `Footer` change

`src/components/Footer.astro`: after the mapped `social` links, one more
item is appended to that same column — a `<button id="support-btn"
type="button">` styled identically to the social links (mono, `gray-3`
hover `white`, small leading glyph) but with a heart icon (reusing the
`.support-btn` / `.heart-icon` hover treatment already defined in
`global.css:104-108`, currently unused) instead of the dot bullet, label
"Поддержать". Clicking it opens the existing `#qr-modal`.

## `index.astro` rewrite

Frontmatter: drop the `Module` interface, the `modules` array, and the
`fetch()`/`try`/`catch` block entirely. Import `Header`, `Hero`, `About`,
`Solutions`, `News`, `YouTubeCarousel`, `Downloads`, `Footer` (all from
`../components/`) plus the existing `Layout`.

Body: `<Layout>` wraps `<Header />`, then the eight sections above in order,
then the (relocated, otherwise unchanged) `#qr-modal` markup and its
`<script>`, with the script's button lookup changed from
`getElementById('support-btn')` (previously the hero button) to the same id
now living in `Footer` — no functional change to the modal logic itself,
just which element triggers it.

The two full-viewport fixed background layers (`bg-grid-fine`, `bg-glow-center`)
that currently sit behind the stub's single `<section>` are removed from
`index.astro` — `Hero.astro` already renders its own grid/glow background
scoped to itself (`Hero.astro:6-10`), and the other components have their
own section backgrounds; a page-wide fixed grid is redundant once there are
eight stacked sections rather than one full-screen hero.

## Out of scope

- No real News content (empty collection, ships with the mechanism only).
- No real YouTube videos (three honest placeholder cards).
- `Blog.astro` and its content collection stay unwired — not part of the
  approved page order, left dormant for a possible future use.
- `Stats.astro` and `Demo.astro` are not used on this page (Stats' numbers
  live inside `About` instead; Demo wasn't in the requested section list).
- Footer's placeholder GitHub/VK URLs (`https://github.com/`,
  `https://vk.com/`) are pre-existing and not touched — fixing them needs
  real URLs the user hasn't supplied, and wasn't asked for here.
- `HeroDemo.astro` is untouched, unused, preserved for later.
