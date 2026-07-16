# Homepage Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "site under construction" stub at `src/pages/index.astro` with a real homepage built from the existing, already-approved component library, reorganized into: Header → Hero → About (with Модули/Подробнее CTAs) → Modules split by Robur/Civil → News → YouTube (placeholder) → Downloads → Footer (with a Поддержать button).

**Architecture:** Six small, independently-buildable changes (one new content-collection feature, one new placeholder component, three modifications to existing components, one component extraction) land first; a final task rewrites `index.astro` to compose all of it and is where the whole page becomes checkable end-to-end.

**Tech Stack:** Astro 5 content collections (`astro:content`, `glob` loader, already used by the dormant `blog` collection), Tailwind (existing tokens only), no client framework, no test runner — verification is `npm run build` plus manual visual checks via `npm run dev`.

**User decisions (already made):**
- Build the new homepage from the existing unused component set (Header/Hero/About/Solutions/Downloads/Footer), not from scratch.
- Drop the "Сайт в разработке" stub messaging entirely — this is now the real page.
- `HeroDemo` stays out of this page (already reverted off `index.astro`'s hero in a prior session; file kept on disk, untouched, for later).
- Modules split into two static groups (Topomatic Robur / Autodesk Civil 3D), not tabs, not a re-fetched external catalog.
- "Новости" ties to `abrmove.ru/news.json` — built as a real Astro JSON endpoint backed by a new content collection, not a rename of the existing `Блог`/`Blog.astro` (which stays dormant).
- YouTube section ships as three honest "coming soon" placeholder cards — no fabricated video data.
- `About`'s support block is replaced by CTA buttons (Модули / Подробнее); the support action itself moves to a new button in `Footer`, reusing the existing QR/ЮMoney modal.
- `Подробнее` in `About` links to `https://github.com/Y-Abramov` (no dedicated about page exists).
- `Stats.astro` and `Demo.astro` are not used on this page.

---

## File Structure

- **Create** `src/content/news/.gitkeep` — keeps the (initially empty) news directory in git; carries a one-line comment on the schema so it's not a mystery empty file.
- **Modify** `src/content.config.ts` — add a `news` collection (title/date/summary/link?/draft?) alongside the existing `blog` collection.
- **Create** `src/components/News.astro` — renders the `news` collection as a dated card list (same visual language as the dormant `Blog.astro`), with an explicit empty state.
- **Create** `src/pages/news.json.ts` — Astro API route serving the same collection as JSON at `/news.json`.
- **Create** `src/components/YouTubeCarousel.astro` — three placeholder cards, no real data yet.
- **Create** `src/components/ModuleCard.astro` — the single-module card, extracted out of `Solutions.astro` so it can be reused across two grouped grids instead of duplicated.
- **Modify** `src/components/Solutions.astro` — use `ModuleCard`, split modules into `roburModules` / `civilModules` (derived from the existing `platform` field, no new data), render two labeled groups instead of one flat grid.
- **Modify** `src/components/About.astro` — replace the "Support block" (right column, bottom) with a short CTA block (Модули / Подробнее).
- **Modify** `src/components/Footer.astro` — append a "Поддержать" button to the Контакты column, styled like the existing social links, using the already-defined-but-unused `.support-btn`/`.heart-icon` hover CSS.
- **Modify** `src/components/Header.astro` — `navItems`: `Блог` (`#blog`) becomes `Новости` (`#news`).
- **Modify** `src/pages/index.astro` — full rewrite: drop the stub hero, the `catalog.json` fetch, and the inline modules/footer markup; compose `Header`/`Hero`/`About`/`Solutions`/`News`/`YouTubeCarousel`/`Downloads`/`Footer`; keep the QR modal and its script, re-pointed at the button now living in `Footer`.

No other files change.

---

## Task 1: News feature — content collection, component, JSON endpoint

**Goal:** Add a `news` content collection, a `News.astro` component that renders it (with a real empty state, since no news exists yet), and a `/news.json` endpoint serving the same data.

**Files:**
- Create: `src/content/news/.gitkeep`
- Modify: `src/content.config.ts`
- Create: `src/components/News.astro`
- Create: `src/pages/news.json.ts`

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] `dist/news.json` exists after build and contains `[]` (empty array — no news entries yet).
- [ ] `News.astro`, when rendered on a page with zero news entries, shows the line "Здесь скоро появятся новости о новых модулях и обновлениях." and no card list.

**Verify:** `cd abr-move && npm run build && cat dist/news.json` → build exits 0, `dist/news.json` prints `[]`.

**Steps:**

- [ ] **Step 1: Create the (empty) news content directory**

```
src/content/news/.gitkeep
```

Content:

```
# .md files here must match the `news` schema in src/content.config.ts:
# title (string), date (date), summary (string), link (url, optional), draft (bool, optional).
```

- [ ] **Step 2: Add the `news` collection to `src/content.config.ts`**

Replace the whole file:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    date: z.coerce.date(),
    tag: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

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

- [ ] **Step 3: Create `src/components/News.astro`**

```astro
---
import { getCollection } from 'astro:content';

const allNews = await getCollection('news', ({ data }) => !data.draft);
const news = allNews.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}
---

<section id="news" class="bg-base border-b border-line">
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">

    <!-- Section header -->
    <div class="reveal flex items-center gap-5 mb-4">
      <span class="section-label">Новости</span>
      <div class="section-rule"></div>
    </div>

    <div class="reveal reveal-delay-1 mb-10">
      <h2 class="text-2xl sm:text-3xl font-bold text-white">Новости и обновления</h2>
    </div>

    {news.length === 0 ? (
      <p class="reveal reveal-delay-2 text-sm text-gray-3 font-mono">
        Здесь скоро появятся новости о новых модулях и обновлениях.
      </p>
    ) : (
      <div class="flex flex-col border border-line divide-y divide-line">
        {news.map((item, i) => {
          const Tag = item.data.link ? 'a' : 'div';
          const linkProps = item.data.link
            ? { href: item.data.link, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <Tag
              {...linkProps}
              class:list={[
                'group flex gap-6 p-5 transition-colors duration-150 reveal',
                item.data.link ? 'hover:bg-surface/60 cursor-pointer' : '',
                `reveal-delay-${Math.min(i + 1, 4)}`,
              ]}
            >
              <div class="shrink-0 hidden sm:flex flex-col justify-start pt-0.5">
                <span class="font-mono text-[10px] text-gray-3">{formatDate(item.data.date)}</span>
              </div>

              <div class="flex-1 min-w-0 flex flex-col gap-1">
                <span class="text-sm font-medium text-white group-hover:text-gray-1 transition-colors leading-snug">
                  {item.data.title}
                </span>
                <span class="text-xs text-gray-3 leading-relaxed hidden lg:block">{item.data.summary}</span>
              </div>

              {item.data.link && (
                <div class="shrink-0 flex items-start pt-0.5 text-gray-4 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </div>
              )}
            </Tag>
          );
        })}
      </div>
    )}
  </div>
</section>
```

- [ ] **Step 4: Create `src/pages/news.json.ts`**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const items = await getCollection('news', ({ data }) => !data.draft);
  const payload = items
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((item) => ({
      title: item.data.title,
      date: item.data.date.toISOString(),
      summary: item.data.summary,
      link: item.data.link ?? null,
    }));

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 5: Build and verify**

Run: `cd abr-move && npm run build`
Expected: exits 0.

Run: `cat dist/news.json`
Expected: `[]`

(`News.astro` isn't imported by any page yet — its empty-state behavior gets a real render check in Task 6, once it's wired into `index.astro`. This step confirms the collection + endpoint work end to end.)

- [ ] **Step 6: Commit**

```bash
cd abr-move
git add src/content/news/.gitkeep src/content.config.ts src/components/News.astro src/pages/news.json.ts
git commit -m "feat: add news content collection, News component, and /news.json endpoint"
```

---

## Task 2: `YouTubeCarousel.astro` — placeholder component

**Goal:** A three-card "coming soon" section, honest about having no real video data yet, with the future data shape documented in a comment.

**Files:**
- Create: `src/components/YouTubeCarousel.astro`

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] Component renders (checked in Task 6) three cards, each with a muted play-icon placeholder and a "Скоро" label — no fabricated titles or links.

**Verify:** `cd abr-move && npm run build` → exits 0.

**Steps:**

- [ ] **Step 1: Create the component**

```astro
---
// Real video shape once available (replace the placeholder loop below with a
// data array of these and use `.map` instead of `[0, 1, 2].map`):
// { title: 'Название видео', youtubeId: 'dQw4w9WgXcQ', thumbnail: '/videos/thumb-1.jpg' }
---

<section id="youtube" class="bg-base border-b border-line">
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">

    <!-- Section header -->
    <div class="reveal flex items-center gap-5 mb-4">
      <span class="section-label">Видео</span>
      <div class="section-rule"></div>
    </div>

    <div class="reveal reveal-delay-1 mb-10">
      <h2 class="text-2xl sm:text-3xl font-bold text-white">Видео по автоматизации</h2>
    </div>

    <div class="reveal reveal-delay-2 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line">
      {[0, 1, 2].map(() => (
        <div class="bg-base flex flex-col gap-4 p-7">
          <div class="aspect-video border border-line bg-surface/40 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-4">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <span class="font-mono text-[10px] tracking-widest2 uppercase text-gray-3">Скоро</span>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd abr-move
git add src/components/YouTubeCarousel.astro
git commit -m "feat: add YouTubeCarousel placeholder component"
```

---

## Task 3: Split `Solutions.astro` into Robur / Civil groups

**Goal:** Extract the per-module card into `ModuleCard.astro`, then render the existing 5-module data as two labeled groups (Topomatic Robur, Autodesk Civil 3D) instead of one flat grid.

**Files:**
- Create: `src/components/ModuleCard.astro`
- Modify: `src/components/Solutions.astro` (full replacement below)

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] "Topomatic Robur" group shows 4 cards: RoadStyle, Profile Tracker, Model Manager, Width Import.
- [ ] "Autodesk Civil 3D" group shows 2 cards: Slab Designer, Width Import.
- [ ] The "Все бесплатно" CTA banner still appears once, after both groups, linking to `#downloads`.

**Verify:** `cd abr-move && npm run build` → exits 0. Visual check in Task 6.

**Steps:**

- [ ] **Step 1: Create `src/components/ModuleCard.astro`**

```astro
---
interface Props {
  mod: {
    num: string;
    name: string;
    desc: string;
    platform: string;
    icon: string;
    href: string;
  };
}
const { mod } = Astro.props;
---

<a href={mod.href} class="group bg-base p-7 flex flex-col gap-5 card-hover cursor-pointer">
  <!-- Number + platform -->
  <div class="flex items-center justify-between">
    <span class="font-mono text-[10px] tracking-widest2 text-gray-3 uppercase">{mod.platform}</span>
    <span class="font-mono text-xs text-gray-4">{mod.num}</span>
  </div>

  <!-- Icon -->
  <div class="text-gray-3 group-hover:text-accent transition-colors duration-200">
    <Fragment set:html={mod.icon} />
  </div>

  <!-- Content -->
  <div class="flex-1 flex flex-col gap-2">
    <h3 class="font-bold text-white text-sm group-hover:text-gray-1 transition-colors">{mod.name}</h3>
    <p class="text-xs text-gray-2 leading-relaxed">{mod.desc}</p>
  </div>

  <!-- Footer -->
  <div class="flex items-center justify-between pt-3 border-t border-line">
    <span class="font-mono text-[10px] text-gray-4 group-hover:text-gray-3 transition-colors">Подробнее</span>
    <svg class="text-gray-4 group-hover:text-accent transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  </div>
</a>
```

- [ ] **Step 2: Replace `src/components/Solutions.astro` with this full content**

```astro
---
import ModuleCard from './ModuleCard.astro';

const modules = [
  {
    num: '01',
    name: 'ABR | RoadStyle',
    desc: 'Управление стилями отображения дорог, поверхностей и слоёв проекта из единого интерфейса.',
    platform: 'Topomatic Robur',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c-4 4-4 16 0 20M12 2c4 4 4 16 0 20"/></svg>`,
    href: '#downloads',
  },
  {
    num: '02',
    name: 'ABR | Profile Tracker',
    desc: 'Пикетаж, отметки, рабочие высоты и уклоны в реальном времени при работе с продольным профилем.',
    platform: 'Topomatic Robur',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    href: '#downloads',
  },
  {
    num: '03',
    name: 'ABR | Model Manager',
    desc: 'Быстрое переключение между поверхностями, коридорами и другими объектами без лишних кликов.',
    platform: 'Topomatic Robur',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    href: '#downloads',
  },
  {
    num: '04',
    name: 'ABR | Slab Designer',
    desc: 'Автоматическая раскладка бетонных плит: расчёт и генерация схем покрытия по параметрам.',
    platform: 'Autodesk Civil 3D',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>`,
    href: '#downloads',
  },
  {
    num: '05',
    name: 'ABR | Width Import',
    desc: 'Импорт параметров поперечного профиля из внешних источников и сторонних моделей.',
    platform: 'Robur / Civil 3D',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    href: '#downloads',
  },
];

const roburModules = modules.filter((m) => m.platform !== 'Autodesk Civil 3D');
const civilModules = modules.filter((m) => m.platform !== 'Topomatic Robur');
---

<section id="solutions" class="bg-base border-b border-line">
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">

    <!-- Section header -->
    <div class="reveal flex items-center gap-5 mb-4">
      <span class="section-label">Модули ABR</span>
      <div class="section-rule"></div>
    </div>

    <div class="reveal reveal-delay-1 flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold text-white leading-snug">
        Инструменты для Robur<br/>и Civil 3D
      </h2>
      <p class="text-gray-2 text-sm font-mono max-w-sm leading-relaxed">
        Каждый модуль решает конкретную задачу.<br/>
        Бесплатно. Без регистрации.
      </p>
    </div>

    <!-- Robur group -->
    <div class="reveal reveal-delay-2 mb-10">
      <div class="flex items-center gap-3 mb-4">
        <span class="font-mono text-xs tracking-widest2 uppercase text-gray-2">Topomatic Robur</span>
        <div class="section-rule"></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
        {roburModules.map((mod) => <ModuleCard mod={mod} />)}
      </div>
    </div>

    <!-- Civil 3D group -->
    <div class="reveal reveal-delay-3 mb-12">
      <div class="flex items-center gap-3 mb-4">
        <span class="font-mono text-xs tracking-widest2 uppercase text-gray-2">Autodesk Civil 3D</span>
        <div class="section-rule"></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line">
        {civilModules.map((mod) => <ModuleCard mod={mod} />)}
      </div>
    </div>

    <!-- CTA banner -->
    <div class="reveal reveal-delay-4 bg-surface/60 border border-line p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
      <div>
        <span class="font-mono text-[10px] tracking-widest2 text-gray-3 uppercase">Все бесплатно</span>
        <p class="mt-2 text-sm text-gray-2 leading-relaxed">
          Все модули доступны для скачивания без оплаты и регистрации.
        </p>
      </div>
      <a href="#downloads" class="btn-white shrink-0">
        Перейти к загрузкам
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd abr-move
git add src/components/ModuleCard.astro src/components/Solutions.astro
git commit -m "feat: split Solutions modules into Robur/Civil groups"
```

---

## Task 4: `About.astro` — swap support block for CTA buttons

**Goal:** Replace the right column's support block with two CTAs: Модули (`#solutions`) and Подробнее (GitHub profile).

**Files:**
- Modify: `src/components/About.astro:81-104`

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] The right column shows the stats grid (unchanged) followed by one paragraph and two buttons — "Модули" (`href="#solutions"`, `btn-accent`) and "Подробнее" (`href="https://github.com/Y-Abramov"`, opens in a new tab, `btn-outline`).
- [ ] The old "Поддержать автора" / "Написать в Telegram" links are gone from `About.astro`.

**Verify:** `cd abr-move && npm run build` → exits 0. Visual check in Task 6.

**Steps:**

- [ ] **Step 1: Replace the support block**

In `src/components/About.astro`, replace lines 81–104:

```astro
        <!-- Support block -->
        <div class="flex-1 p-8 flex flex-col gap-5">
          <div>
            <h3 class="font-bold text-white text-sm mb-2">Поддержать автора</h3>
            <p class="text-sm text-gray-2 leading-relaxed">
              Если модули помогают в работе, буду рад любой поддержке. Это мотивирует продолжать разработку.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <a href="#" class="btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Поддержать
            </a>
            <a href="#" class="btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              Написать в Telegram
            </a>
          </div>
        </div>
```

with:

```astro
        <!-- CTA block -->
        <div class="flex-1 p-8 flex flex-col justify-center gap-6">
          <p class="text-sm text-gray-2 leading-relaxed">
            Все модули бесплатны и открыты для скачивания. Исходники, документация и статьи — по ссылкам ниже.
          </p>

          <div class="flex flex-wrap gap-3">
            <a href="#solutions" class="btn-accent">
              Модули
            </a>
            <a href="https://github.com/Y-Abramov" target="_blank" rel="noopener noreferrer" class="btn-outline">
              Подробнее
            </a>
          </div>
        </div>
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd abr-move
git add src/components/About.astro
git commit -m "feat: replace About support block with Модули/Подробнее CTAs"
```

---

## Task 5: `Footer.astro` — add "Поддержать" button

**Goal:** Add a support-trigger button to the Контакты column, styled like the existing social links, reusing the dormant `.support-btn`/`.heart-icon` CSS.

**Files:**
- Modify: `src/components/Footer.astro:53-67`

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] The Контакты column shows Telegram/GitHub/VK/Email (unchanged) followed by a "Поддержать" button with `id="support-btn"`.
- [ ] Hovering the button's heart icon triggers the `.support-btn:hover .heart-icon` fill/glow already defined in `global.css:104-108`.

**Verify:** `cd abr-move && npm run build` → exits 0. Visual + click check in Task 6 (needs the modal from `index.astro` to actually open).

**Steps:**

- [ ] **Step 1: Add the button**

In `src/components/Footer.astro`, replace lines 53–67:

```astro
      <!-- Social -->
      <div class="py-10 md:pl-10 flex flex-col gap-3">
        <span class="section-label mb-2">Контакты</span>
        {social.map((s) => (
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-xs text-gray-3 hover:text-white transition-colors cursor-pointer w-fit flex items-center gap-2 group"
          >
            <span class="w-1 h-1 bg-gray-4 group-hover:bg-accent transition-colors rounded-full"></span>
            {s.label}
          </a>
        ))}
      </div>
```

with:

```astro
      <!-- Social -->
      <div class="py-10 md:pl-10 flex flex-col gap-3">
        <span class="section-label mb-2">Контакты</span>
        {social.map((s) => (
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-xs text-gray-3 hover:text-white transition-colors cursor-pointer w-fit flex items-center gap-2 group"
          >
            <span class="w-1 h-1 bg-gray-4 group-hover:bg-accent transition-colors rounded-full"></span>
            {s.label}
          </a>
        ))}
        <button
          id="support-btn"
          type="button"
          class="support-btn group font-mono text-xs text-gray-3 hover:text-white transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <svg class="heart-icon transition-all duration-200" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          Поддержать
        </button>
      </div>
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd abr-move
git add src/components/Footer.astro
git commit -m "feat: add support button to Footer, reusing existing modal hooks"
```

---

## Task 6: Wire everything into `index.astro`, update Header nav

**Goal:** Compose the full page from all components, drop the stub hero/fetch/inline markup, keep the QR modal working via the button now in `Footer`, and update `Header`'s nav label.

**Files:**
- Modify: `src/components/Header.astro:5`
- Modify: `src/pages/index.astro` (full replacement below)

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] Page order top to bottom: fixed `Header`, `Hero`, `About`, `Solutions` (Robur/Civil groups), `News` (empty state), `YouTubeCarousel` (3 placeholders), `Downloads`, `Footer`.
- [ ] No "Сайт в разработке" text anywhere on the page.
- [ ] Header nav shows "Новости" (not "Блог"), linking to `#news`, which scrolls to the `News` section.
- [ ] Clicking Footer's "Поддержать" button opens the QR/ЮMoney modal; `Escape`, the backdrop, and the close button all close it.
- [ ] `dist/news.json` still returns `[]` (Task 1 behavior unaffected).

**Verify:** `cd abr-move && npm run build` → exits 0. Manual check via `npm run dev`: scroll the whole page, click every nav link, open/close the support modal from the footer.

**Steps:**

- [ ] **Step 1: Update `Header`'s nav**

In `src/components/Header.astro`, line 5, replace:

```astro
  { label: 'Блог', href: '#blog' },
```

with:

```astro
  { label: 'Новости', href: '#news' },
```

- [ ] **Step 2: Replace `src/pages/index.astro` with this full content**

```astro
---
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import About from '../components/About.astro';
import Solutions from '../components/Solutions.astro';
import News from '../components/News.astro';
import YouTubeCarousel from '../components/YouTubeCarousel.astro';
import Downloads from '../components/Downloads.astro';
import Footer from '../components/Footer.astro';
---

<Layout title="ABR | MOVE: Инструменты для проектирования дорог">
  <Header />

  <main class="bg-base flex flex-col">
    <Hero />
    <About />
    <Solutions />
    <News />
    <YouTubeCarousel />
    <Downloads />
  </main>

  <Footer />

  <!-- Support modal -->
  <div id="qr-modal" class="fixed inset-0 z-50 hidden items-center justify-center px-4">
    <div id="qr-backdrop" class="absolute inset-0 bg-black/75 backdrop-blur-sm"></div>

    <div class="relative bg-surface border border-line flex flex-col max-w-sm w-full overflow-hidden">

      <button id="qr-close" class="absolute top-3 right-3 text-gray-3 hover:text-white transition-colors cursor-pointer z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="px-7 pt-7 pb-5 border-b border-line flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#E53E6D" stroke="#E53E6D" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span class="font-bold text-white text-sm">Поддержать автора</span>
      </div>

      <div class="px-7 py-5 border-b border-line">
        <p class="text-[12px] text-gray-2 leading-relaxed mb-4">
          Все инструменты я делаю после основной работы, потому что сам сталкивался с теми же задачами, что и Вы. Если хоть один модуль сэкономил Вам час, буду рад любой поддержке.
        </p>
        <ul class="flex flex-col gap-2">
          {[
            'Больше времени на новые модули',
            'Поддержка и обновления под новые версии Robur',
            'Статьи и видео по реальным задачам проектирования',
          ].map(item => (
            <li class="flex items-center gap-2 text-[11px] text-gray-3">
              <span class="w-1 h-1 rounded-full bg-accent shrink-0"></span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div class="px-7 py-6 flex flex-col items-center gap-5">
        <div class="w-44 h-44 border border-line p-2 bg-surface flex items-center justify-center">
          <img
            src="/qr-yoomoney.png"
            alt="QR ЮMoney"
            class="w-full h-full object-contain"
          />
        </div>

        <div class="flex flex-col items-center gap-1">
          <span class="text-[11px] text-gray-3">Отсканируйте камерой телефона</span>
          <span class="font-mono text-[10px] text-gray-4">ЮMoney</span>
        </div>

        <a
          href="https://yoomoney.ru/to/4100119553658750"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full flex items-stretch overflow-hidden bg-[#8448FF] hover:bg-[#9560FF] transition-colors duration-150"
        >
          <span class="flex items-center justify-center px-5 bg-black/25 text-white font-black text-xl leading-none select-none">
            Ю
          </span>
          <span class="flex items-center justify-center flex-1 py-3.5 px-4 text-white text-sm font-semibold tracking-wide">
            Перевести через ЮMoney
          </span>
        </a>
      </div>

      <div class="px-7 py-4 border-t border-line">
        <p class="text-[11px] text-gray-4 text-center leading-relaxed">
          Спасибо. Это правда важно и мотивирует делать больше.
        </p>
      </div>
    </div>
  </div>

  <script>
    const btn = document.getElementById('support-btn');
    const modal = document.getElementById('qr-modal');
    const backdrop = document.getElementById('qr-backdrop');
    const close = document.getElementById('qr-close');

    btn?.addEventListener('click', () => {
      modal?.classList.remove('hidden');
      modal?.classList.add('flex');
    });

    const closeModal = () => {
      modal?.classList.add('hidden');
      modal?.classList.remove('flex');
    };

    close?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  </script>
</Layout>
```

- [ ] **Step 3: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 4: Manual check**

Run: `cd abr-move && npm run dev`, open `http://127.0.0.1:4321`. Walk through every Acceptance Criterion above, including all `Header` nav links and the footer support button/modal.

- [ ] **Step 5: Commit**

```bash
cd abr-move
git add src/components/Header.astro src/pages/index.astro
git commit -m "feat: rebuild homepage from the component library, drop construction stub"
```

---

## Self-Review Notes

- **Spec coverage:** Page composition/order → Task 6. Header nav → Task 6 Step 1. About CTAs → Task 4. Solutions Robur/Civil split → Task 3. News (collection + component + JSON endpoint) → Task 1. YouTube placeholder → Task 2. Footer support button → Task 5. Modal relocation/re-wiring → Task 6. All spec sections covered; `HeroDemo` exclusion and `Blog`/`Stats`/`Demo` non-use require no task (absence is the correct state, already true after the prior session's revert).
- **Placeholder scan:** No TBD/TODO. The News empty-state and YouTube "coming soon" cards are deliberate, spec'd UI states, not unfinished code.
- **Type consistency:** `ModuleCard`'s `Props.mod` shape matches every field used in `Solutions.astro`'s `modules` array (`num`, `name`, `desc`, `platform`, `icon`, `href`). `News.astro` and `news.json.ts` both read the same `news` collection fields (`title`, `date`, `summary`, `link`, `draft`) defined once in `content.config.ts`. The `support-btn` id is used by exactly one element after Task 6 (Footer's button) and looked up by exactly one script (the modal script in `index.astro`) — no collision, unlike the old stub which also had `id="support-btn"` on its hero button (removed in Task 6).
