# Site-wide Light/Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every color on the live homepage theme-aware via CSS custom properties (dark = today's look, unchanged; light = new), replace Header's "Скачать" CTA with a working sun/moon toggle, and swap in the dark-colored logo variant for light mode.

**Architecture:** `global.css` gains a `:root` / `:root[data-theme="light"]` variable pair per color token; `tailwind.config.mjs` points every token at its variable instead of a literal hex, so existing utility classes (`bg-base`, `text-gray-3`, …) become theme-reactive with zero markup changes. A blocking inline script in `Layout.astro` sets `data-theme` before first paint (no flash of the wrong theme). `Header.astro` gets the toggle button + script (ported from `public/sp42-2016-vs-2026.html`) and a dark/light logo pair. One mechanical rename (`text-white` → `text-gray-1`) runs across the 9 files that actually render on the live page, consolidating two near-identical "brightest text" colors into the one that's theme-reactive.

**Tech Stack:** CSS custom properties, Tailwind (`colors` config pointing at `var(--color-*)`), vanilla JS (no dependencies), Astro. No test runner — verification is `npm run build` plus a manual light/dark toggle check via `npm run dev`.

**User decisions (already made):**
- Full light/dark theme for the whole live site, not just a decorative header button.
- Copy the architecture and light-mode values from `public/sp42-2016-vs-2026.html` wherever a token matches (five already share exact hex with our dark palette, confirming the two pages share a design system).
- Theme toggle replaces the header's "Скачать" CTA; it must be visible at every breakpoint (unlike the CTA it replaces, which was desktop-only), not just desktop.
- Dead/unwired components (`Blog.astro`, `Demo.astro`, `Stats.astro`, `HeroDemo.astro`) are not themed.
- `Hero.astro`'s decorative watermark SVG and the ЮMoney brand-purple button stay literal (not theme tokens).

---

## File Structure

- **Modify** `src/styles/global.css` — add the two `:root` variable blocks; convert every hardcoded hex in `@layer base`/`utilities`/`components` to the matching `var(--color-*)`; add the `.logo-for-dark`/`.logo-for-light` visibility rule.
- **Modify** `tailwind.config.mjs` — `colors` values become `var(--color-*)` references (keys unchanged).
- **Modify** `src/layouts/Layout.astro` — add the blocking theme-init `<script>`.
- **Modify** `src/components/Header.astro` — dual logo images, remove the "Скачать" CTA, add the toggle button + its script, fix the scroll-spy script's hardcoded active-link color, rename `hover:text-white` → `hover:text-gray-1`.
- **Modify** `src/components/Footer.astro` — dual logo images, rename `hover:text-white` → `hover:text-gray-1`.
- **Modify** `src/components/Hero.astro`, `src/components/About.astro`, `src/components/Solutions.astro`, `src/components/ModuleCard.astro`, `src/components/News.astro`, `src/components/YouTubeCarousel.astro`, `src/components/Downloads.astro`, `src/pages/index.astro` — mechanical `text-white` → `text-gray-1` rename (see Task 5 for the handful of spots where a redundant `group-hover:text-gray-1` modifier is dropped instead of duplicated).

No other files change.

---

## Task 1: CSS variable token system

**Goal:** Every color token becomes a CSS variable with a dark (default) and light (`[data-theme="light"]`) value; every existing hardcoded hex in `global.css`'s own rules switches to the matching variable.

**Files:**
- Modify: `src/styles/global.css` (full replacement)
- Modify: `tailwind.config.mjs` (full replacement)

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] With no `data-theme` override (simulating a first-time visitor before Task 2 lands), the site renders pixel-identical to before this change — dark values are copied verbatim from the current hardcoded hex.
- [ ] Setting `data-theme="light"` on `<html>` in devtools recolors `bg-base`/`text-gray-1`/etc. site-wide without a page reload.

**Verify:** `cd abr-move && npm run build` → exits 0.

**Steps:**

- [ ] **Step 1: Replace `src/styles/global.css` with this full content**

```css
:root {
  --color-base: #09090E;
  --color-surface: #10121A;
  --color-elevated: #181B27;
  --color-line: #1C1F2E;
  --color-line-light: #282D45;
  --color-gray-1: #E2E4EF;
  --color-gray-2: #888BA8;
  --color-gray-3: #42466A;
  --color-gray-4: #252840;
  --color-accent: #22D3EE;
  --color-accent-dim: #0C4A56;
  --color-accent-rgb: 34, 211, 238;
  --color-amber: #F5A524;
  --color-emerald: #34D399;
  --color-rose: #FB5E7E;
  --color-violet: #A78BFA;
}

:root[data-theme='light'] {
  --color-base: #F6F7FB;
  --color-surface: #FFFFFF;
  --color-elevated: #EEF0F6;
  --color-line: #E1E4EE;
  --color-line-light: #CBD0E0;
  --color-gray-1: #14161F;
  --color-gray-2: #5B5F78;
  --color-gray-3: #8A8FA6;
  --color-gray-4: #C3C7D6;
  --color-accent: #0C8599;
  --color-accent-dim: #CFF3F8;
  --color-accent-rgb: 12, 133, 153;
  --color-amber: #A9660A;
  --color-emerald: #0E8F63;
  --color-rose: #C81E4A;
  --color-violet: #6D4FC4;
}

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    background-color: var(--color-base);
    color: var(--color-gray-1);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  ::selection {
    background-color: rgba(var(--color-accent-rgb), 0.2);
    color: var(--color-gray-1);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--color-base); }
  ::-webkit-scrollbar-thumb { background: var(--color-line); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--color-line-light); }
}

@layer utilities {
  .section-label {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-gray-3);
    white-space: nowrap;
  }

  .section-rule {
    width: 100%;
    height: 1px;
    background-color: var(--color-line);
  }

  /* Scroll reveal */
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1);
  }

  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .reveal-delay-1 { transition-delay: 0.08s; }
  .reveal-delay-2 { transition-delay: 0.16s; }
  .reveal-delay-3 { transition-delay: 0.24s; }
  .reveal-delay-4 { transition-delay: 0.32s; }
  .reveal-delay-5 { transition-delay: 0.40s; }

  /* Fade only variant */
  .reveal-fade {
    opacity: 0;
    transition: opacity 0.6s ease;
  }
  .reveal-fade.visible {
    opacity: 1;
  }

  /* Accent glow on hover */
  .glow-hover:hover {
    box-shadow: 0 0 0 1px rgba(var(--color-accent-rgb), 0.3), 0 0 20px rgba(var(--color-accent-rgb), 0.06);
  }

  /* Card accent border on hover */
  .card-hover {
    transition: border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease;
  }
  .card-hover:hover {
    border-color: var(--color-line-light);
    background-color: var(--color-surface);
    box-shadow: 0 0 0 1px rgba(var(--color-accent-rgb), 0.1), 0 8px 32px rgba(0,0,0,0.4);
  }

  /* Theme-aware logo swap: the light-colored wordmark shows by default
     (and under data-theme="dark"); data-theme="light" swaps in the
     dark-colored one instead. Used by Header.astro and Footer.astro. */
  .logo-for-light { display: none; }
  :root[data-theme='light'] .logo-for-dark { display: none; }
  :root[data-theme='light'] .logo-for-light { display: block; }
}

/* Accent CTA button */
@layer components {
  .btn-accent {
    @apply inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-base text-xs font-mono tracking-widest2 uppercase font-medium cursor-pointer;
    color: var(--color-base);
    transition: filter 180ms ease, box-shadow 180ms ease;
  }
  .btn-accent:hover {
    filter: brightness(1.1);
    box-shadow: 0 0 20px rgba(var(--color-accent-rgb), 0.25);
  }

  .btn-outline {
    @apply inline-flex items-center gap-2 px-5 py-2.5 border border-line-light text-gray-2 text-xs font-mono tracking-widest2 uppercase cursor-pointer;
    transition: border-color 180ms ease, color 180ms ease;
  }
  .btn-outline:hover {
    border-color: var(--color-gray-2);
    color: var(--color-gray-1);
  }

  .support-btn:hover .heart-icon {
    fill: #E53E6D;
    stroke: #E53E6D;
    filter: drop-shadow(0 0 8px rgba(229, 62, 109, 0.5));
  }

  .btn-white {
    @apply inline-flex items-center gap-2 px-5 py-2.5 bg-gray-1 text-xs font-mono tracking-widest2 uppercase font-medium cursor-pointer;
    color: var(--color-base);
    transition: opacity 180ms ease;
  }
  .btn-white:hover {
    opacity: 0.9;
  }
}
```

- [ ] **Step 2: Replace `tailwind.config.mjs` with this full content**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--color-base)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        line: 'var(--color-line)',
        'line-light': 'var(--color-line-light)',
        white: '#FFFFFF',
        'gray-1': 'var(--color-gray-1)',
        'gray-2': 'var(--color-gray-2)',
        'gray-3': 'var(--color-gray-3)',
        'gray-4': 'var(--color-gray-4)',
        accent: 'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
        'accent-glow': 'rgba(34, 211, 238, 0.10)',
        amber: 'var(--color-amber)',
        emerald: 'var(--color-emerald)',
        rose: 'var(--color-rose)',
        violet: 'var(--color-violet)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-fine': `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        'grid-coarse': `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        'glow-accent': 'radial-gradient(ellipse 60% 40% at 70% 50%, rgba(34,211,238,0.07) 0%, transparent 70%)',
        'glow-center': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.05) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
        'grid-48': '48px 48px',
        'grid-80': '80px 80px',
      },
      letterSpacing: {
        widest2: '0.2em',
        widest3: '0.3em',
      },
    },
  },
  plugins: [],
};
```

(`backgroundImage`'s grid/glow gradients and `accent-glow` stay literal — see the spec's "Out of scope" section. `white` stays literal `#FFFFFF` — it is not becoming a theme token.)

- [ ] **Step 3: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0. Visually, dark mode is unaffected (no `data-theme` attribute exists yet — Task 2 adds it — so `:root`'s dark values are what's live, identical to today's hardcoded hex).

- [ ] **Step 4: Commit**

```bash
cd abr-move
git add src/styles/global.css tailwind.config.mjs
git commit -m "feat: convert color tokens to CSS variables for light/dark theming"
```

---

## Task 2: Blocking theme-init script in `Layout.astro`

**Goal:** `data-theme` is set on `<html>` before first paint, from `localStorage`, defaulting to `dark` — no flash of the wrong theme on repeat visits.

**Files:**
- Modify: `src/layouts/Layout.astro`

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] In a browser with `localStorage['abr-move-theme'] = 'light'` set, a hard page reload never shows a dark flash before switching to light.
- [ ] With no stored preference, `<html>` has `data-theme="dark"` immediately.

**Verify:** `cd abr-move && npm run build` → exits 0. Manual check in Task 6.

**Steps:**

- [ ] **Step 1: Add the blocking script right after `<meta charset>`**

In `src/layouts/Layout.astro`, replace:

```astro
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

with:

```astro
  <head>
    <meta charset="UTF-8" />
    <script>
      (function () {
        try {
          var t = localStorage.getItem('abr-move-theme') || 'dark';
          document.documentElement.setAttribute('data-theme', t);
        } catch (e) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      })();
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd abr-move
git add src/layouts/Layout.astro
git commit -m "feat: add blocking theme-init script to prevent flash of wrong theme"
```

---

## Task 3: `Header.astro` — toggle button, dual logo, rename

**Goal:** Replace the "Скачать" CTA with a working sun/moon theme toggle visible at every breakpoint; render both logo color variants; fix the scroll-spy script's hardcoded accent color; rename `hover:text-white` → `hover:text-gray-1`.

**Files:**
- Modify: `src/components/Header.astro` (full replacement)

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] The "Скачать" pill CTA is gone from the header (the mobile dropdown's "Скачать модули" button is untouched).
- [ ] A sun/moon toggle button sits between the nav and the mobile hamburger, visible on mobile *and* desktop.
- [ ] Clicking it flips `data-theme` on `<html>`, updates `<meta name="theme-color">`, and persists to `localStorage['abr-move-theme']`.
- [ ] Both `logo-lockup-white.png` and `logo-lockup.png` are in the DOM; only one is visible at a time per theme (checked via devtools `display` computed style, not just visual glance).
- [ ] The active nav link's underline/color (scroll-spy) uses the current theme's accent, not a hardcoded dark-only cyan.

**Verify:** `cd abr-move && npm run build` → exits 0. Manual check in Task 6.

**Steps:**

- [ ] **Step 1: Replace `src/components/Header.astro` with this full content**

```astro
---
const navItems = [
  { label: 'Главная', href: '#hero' },
  { label: 'Модули', href: '#solutions' },
  { label: 'Новости', href: '#news' },
  { label: 'Документация', href: '#downloads' },
  { label: 'Обо мне', href: '#about' },
];
---

<header class="fixed top-0 left-0 right-0 z-50 border-b border-line bg-base/80 backdrop-blur-md">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-14">

      <!-- Logo -->
      <a href="/" class="flex items-center shrink-0 cursor-pointer">
        <img src="/logo-lockup-white.png" alt="ABR MOVE" class="logo-for-dark h-[38px] w-auto" />
        <img src="/logo-lockup.png" alt="ABR MOVE" class="logo-for-light h-[38px] w-auto" />
      </a>

      <!-- Desktop nav -->
      <nav id="nav-links" class="hidden lg:flex items-center gap-7">
        {navItems.map((item) => (
          <a
            href={item.href}
            class="font-mono text-[11px] tracking-widest2 uppercase text-gray-3 hover:text-gray-1 transition-colors duration-150 cursor-pointer"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <!-- Theme toggle -->
      <button id="theme-toggle" type="button" class="theme-toggle shrink-0" aria-label="Переключить тему">
        <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a.5.5 0 0 0-.65-.6A9 9 0 1 0 21.1 15.15a.5.5 0 0 0-.6-.65z"/>
        </svg>
      </button>

      <!-- Mobile toggle -->
      <button id="menu-toggle" class="md:hidden p-1.5 text-gray-3 hover:text-gray-1 transition-colors cursor-pointer" aria-label="Меню">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="8" x2="21" y2="8"/>
          <line x1="3" y1="16" x2="21" y2="16"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  <div id="mobile-menu" class="hidden border-t border-line bg-surface">
    <nav class="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-4">
      {navItems.map((item) => (
        <a href={item.href} class="font-mono text-xs tracking-widest2 uppercase text-gray-2 hover:text-gray-1 transition-colors cursor-pointer">
          {item.label}
        </a>
      ))}
      <a href="#downloads" class="mt-2 btn-accent self-start">
        Скачать модули
      </a>
    </nav>
  </div>
</header>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 7px;
    padding: 0;
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    color: var(--color-gray-2);
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  .theme-toggle:hover {
    color: var(--color-accent);
    border-color: var(--color-line-light);
  }
  .theme-toggle svg { display: none; }
  :root[data-theme='dark'] .theme-toggle .icon-moon { display: block; }
  :root[data-theme='light'] .theme-toggle .icon-sun { display: block; }
</style>

<script>
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle?.addEventListener('click', () => menu?.classList.toggle('hidden'));

  // Theme toggle: flips data-theme on <html>, persists choice, updates theme-color meta.
  (function () {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const COLORS = { dark: '#09090E', light: '#F6F7FB' };
    if (!btn) return;

    function apply(theme) {
      root.setAttribute('data-theme', theme);
      if (metaTheme) metaTheme.setAttribute('content', COLORS[theme] || COLORS.dark);
      btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }

    apply(root.getAttribute('data-theme') || 'dark');

    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      try {
        localStorage.setItem('abr-move-theme', next);
      } catch (e) {}
    });
  })();

  // Highlight the current section in the desktop nav on scroll.
  (function () {
    const nav = document.getElementById('nav-links');
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const pairs = links
      .map((link) => {
        const section = document.getElementById(link.getAttribute('href').slice(1));
        return section ? { link, section } : null;
      })
      .filter(Boolean);
    if (!pairs.length) return;

    const HEADER_CLEARANCE = 56 + 40;
    let activeId = null;

    function setActive(id) {
      if (id === activeId) return;
      activeId = id;
      for (const { link, section } of pairs) {
        const on = section.id === id;
        link.style.color = on ? 'var(--color-accent)' : '';
        link.style.textDecoration = on ? 'underline' : '';
        link.style.textDecorationColor = on ? 'var(--color-accent)' : '';
        link.style.textUnderlineOffset = on ? '6px' : '';
      }
    }

    function update() {
      let current = null;
      for (const pair of pairs) {
        if (pair.section.getBoundingClientRect().top <= HEADER_CLEARANCE) current = pair;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = pairs[pairs.length - 1];
      }
      setActive(current ? current.section.id : null);
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();
</script>
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd abr-move
git add src/components/Header.astro
git commit -m "feat: replace header CTA with theme toggle, add dual-color logo"
```

---

## Task 4: `Footer.astro` — dual logo, rename

**Goal:** Same dark/light logo swap as the header; rename `hover:text-white` → `hover:text-gray-1`.

**Files:**
- Modify: `src/components/Footer.astro` (full replacement)

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] Both logo images are in the DOM; only one visible per theme (same check as Task 3).
- [ ] Footer nav/social/support links no longer reference `text-white` anywhere.

**Verify:** `cd abr-move && npm run build` → exits 0. Manual check in Task 6.

**Steps:**

- [ ] **Step 1: Replace `src/components/Footer.astro` with this full content**

```astro
---
const nav = [
  { label: 'Главная', href: '#hero' },
  { label: 'Модули', href: '#solutions' },
  { label: 'Новости', href: '#news' },
  { label: 'Документация', href: '#downloads' },
  { label: 'Обо мне', href: '#about' },
];

const social = [
  { label: 'Telegram', href: 'https://t.me/yabramove' },
  { label: 'GitHub', href: 'https://github.com/' },
  { label: 'VK', href: 'https://vk.com/' },
  { label: 'Email', href: 'mailto:yaroslav@abr-move.ru' },
];
---

<footer id="footer" class="border-t border-line bg-base">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">

    <!-- Top block -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-line divide-y md:divide-y-0 md:divide-x divide-line">

      <!-- Brand -->
      <div class="py-10 md:pr-10 flex flex-col gap-5">
        <div class="flex items-center">
          <img src="/logo-lockup-white.png" alt="ABR MOVE" class="logo-for-dark h-[38px] w-auto" />
          <img src="/logo-lockup.png" alt="ABR MOVE" class="logo-for-light h-[38px] w-auto" />
        </div>
        <p class="font-mono text-xs text-gray-3 leading-relaxed">
          Инструменты для проектирования<br/>
          автомобильных дорог.
        </p>
        <div class="inline-flex items-center gap-1.5 border border-accent-dim bg-accent-glow px-2.5 py-1 w-fit">
          <span class="w-1 h-1 rounded-full bg-accent"></span>
          <span class="font-mono text-[9px] tracking-widest2 uppercase text-accent">Robur Expert</span>
        </div>
      </div>

      <!-- Nav -->
      <div class="py-10 md:px-10 flex flex-col gap-3">
        <span class="section-label mb-2">Навигация</span>
        {nav.map((l) => (
          <a href={l.href} class="font-mono text-xs text-gray-3 hover:text-gray-1 transition-colors cursor-pointer w-fit">
            {l.label}
          </a>
        ))}
      </div>

      <!-- Social -->
      <div class="py-10 md:pl-10 flex flex-col gap-3">
        <span class="section-label mb-2">Контакты</span>
        {social.map((s) => (
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-xs text-gray-3 hover:text-gray-1 transition-colors cursor-pointer w-fit flex items-center gap-2 group"
          >
            <span class="w-1 h-1 bg-gray-4 group-hover:bg-accent transition-colors rounded-full"></span>
            {s.label}
          </a>
        ))}
        <button
          id="support-btn"
          type="button"
          class="support-btn group font-mono text-xs text-gray-3 hover:text-gray-1 transition-colors cursor-pointer w-fit flex items-center gap-2"
        >
          <svg class="heart-icon transition-all duration-200" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          Поддержать
        </button>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p class="font-mono text-[10px] text-gray-4">© {new Date().getFullYear()} ABR | MOVE, Ярослав Абрамов</p>
      <p class="font-mono text-[10px] text-gray-4">v1.0.0</p>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd abr-move
git add src/components/Footer.astro
git commit -m "feat: add dual-color logo to footer, rename hover state"
```

---

## Task 5: Rename `text-white` → `text-gray-1` in the remaining live components

**Goal:** Every remaining live-rendered use of `text-white` becomes `text-gray-1`. Three spots (`ModuleCard.astro`, `News.astro`, `Downloads.astro`) currently pair `text-white` with a now-redundant `group-hover:text-gray-1` — since the resting state is becoming `gray-1` itself, that hover modifier is dropped instead of duplicated. Two spots in `index.astro`'s ЮMoney button stay untouched (brand color, not a theme token).

**Files:**
- Modify: `src/components/Hero.astro`
- Modify: `src/components/About.astro`
- Modify: `src/components/Solutions.astro`
- Modify: `src/components/ModuleCard.astro`
- Modify: `src/components/News.astro`
- Modify: `src/components/YouTubeCarousel.astro`
- Modify: `src/components/Downloads.astro`
- Modify: `src/pages/index.astro`

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] `grep -rn "text-white" src/components/Hero.astro src/components/About.astro src/components/Solutions.astro src/components/ModuleCard.astro src/components/News.astro src/components/YouTubeCarousel.astro src/components/Downloads.astro` returns nothing.
- [ ] `grep -n "text-white" src/pages/index.astro` returns exactly 2 matches (the ЮMoney button's two spans, both inside `bg-[#8448FF]`).
- [ ] Module/post titles that had the redundant `group-hover:text-gray-1` now render with no leftover unused hover modifier and no console/build warnings.

**Verify:** `cd abr-move && npm run build` → exits 0, then run the two `grep` commands above and confirm the counts.

**Steps:**

- [ ] **Step 1: `src/components/Hero.astro`**

Replace:
```astro
      <h1 class="reveal reveal-delay-1 font-bold text-white leading-[1.05] tracking-tight"
```
with:
```astro
      <h1 class="reveal reveal-delay-1 font-bold text-gray-1 leading-[1.05] tracking-tight"
```

Replace:
```astro
          <span class="font-mono font-bold text-white text-xl">{s.v}</span>
```
with:
```astro
          <span class="font-mono font-bold text-gray-1 text-xl">{s.v}</span>
```

(The decorative road-line SVG's `stroke="white"` attributes, further up in the same file, are left untouched — see spec.)

- [ ] **Step 2: `src/components/About.astro`**

Replace:
```astro
      <h2 class="text-2xl sm:text-3xl font-bold text-white">Ярослав Абрамов</h2>
```
with:
```astro
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-1">Ярослав Абрамов</h2>
```

Replace:
```astro
          <div class="w-12 h-12 border border-line bg-surface flex items-center justify-center font-bold text-white text-sm select-none shrink-0">
```
with:
```astro
          <div class="w-12 h-12 border border-line bg-surface flex items-center justify-center font-bold text-gray-1 text-sm select-none shrink-0">
```

Replace:
```astro
            <div class="font-bold text-white text-sm">Ярослав Абрамов</div>
```
with:
```astro
            <div class="font-bold text-gray-1 text-sm">Ярослав Абрамов</div>
```

Replace:
```astro
              <span class="font-mono font-bold text-2xl text-white">{s.v}</span>
```
with:
```astro
              <span class="font-mono font-bold text-2xl text-gray-1">{s.v}</span>
```

- [ ] **Step 3: `src/components/Solutions.astro`**

Replace:
```astro
      <h2 class="text-2xl sm:text-3xl font-bold text-white leading-snug">
```
with:
```astro
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-1 leading-snug">
```

- [ ] **Step 4: `src/components/ModuleCard.astro`**

Replace:
```astro
    <h3 class="font-bold text-white text-sm group-hover:text-gray-1 transition-colors">{mod.name}</h3>
```
with:
```astro
    <h3 class="font-bold text-gray-1 text-sm transition-colors">{mod.name}</h3>
```

- [ ] **Step 5: `src/components/News.astro`**

Replace:
```astro
    <div class="reveal reveal-delay-1 mb-10">
      <h2 class="text-2xl sm:text-3xl font-bold text-white">Новости и обновления</h2>
    </div>
```
with:
```astro
    <div class="reveal reveal-delay-1 mb-10">
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-1">Новости и обновления</h2>
    </div>
```

Replace:
```astro
                <span class="text-sm font-medium text-white group-hover:text-gray-1 transition-colors leading-snug">
```
with:
```astro
                <span class="text-sm font-medium text-gray-1 transition-colors leading-snug">
```

- [ ] **Step 6: `src/components/YouTubeCarousel.astro`**

Replace:
```astro
      <h2 class="text-2xl sm:text-3xl font-bold text-white">Видео по автоматизации</h2>
```
with:
```astro
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-1">Видео по автоматизации</h2>
```

- [ ] **Step 7: `src/components/Downloads.astro`**

Replace:
```astro
    <div class="reveal reveal-delay-1 mb-10">
      <h2 class="text-2xl sm:text-3xl font-bold text-white">Скачать модули</h2>
    </div>
```
with:
```astro
    <div class="reveal reveal-delay-1 mb-10">
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-1">Скачать модули</h2>
    </div>
```

Replace:
```astro
            <span class="text-sm text-white font-medium group-hover:text-gray-1 transition-colors">{mod.name}</span>
```
with:
```astro
            <span class="text-sm text-gray-1 font-medium transition-colors">{mod.name}</span>
```

- [ ] **Step 8: `src/pages/index.astro`**

Replace:
```astro
      <button id="qr-close" class="absolute top-3 right-3 text-gray-3 hover:text-white transition-colors cursor-pointer z-10">
```
with:
```astro
      <button id="qr-close" class="absolute top-3 right-3 text-gray-3 hover:text-gray-1 transition-colors cursor-pointer z-10">
```

Replace:
```astro
        <span class="font-bold text-white text-sm">Поддержать автора</span>
```
with:
```astro
        <span class="font-bold text-gray-1 text-sm">Поддержать автора</span>
```

(Do **not** touch the two `text-white` spans inside the `bg-[#8448FF]` ЮMoney button further down — that's a fixed third-party brand color, out of scope per the design spec.)

- [ ] **Step 9: Build and verify**

Run: `cd abr-move && npm run build`
Expected: exits 0.

Run:
```bash
grep -rn "text-white" src/components/Hero.astro src/components/About.astro src/components/Solutions.astro src/components/ModuleCard.astro src/components/News.astro src/components/YouTubeCarousel.astro src/components/Downloads.astro
```
Expected: no output.

Run: `grep -n "text-white" src/pages/index.astro`
Expected: exactly 2 lines (the ЮMoney button spans).

- [ ] **Step 10: Commit**

```bash
cd abr-move
git add src/components/Hero.astro src/components/About.astro src/components/Solutions.astro src/components/ModuleCard.astro src/components/News.astro src/components/YouTubeCarousel.astro src/components/Downloads.astro src/pages/index.astro
git commit -m "refactor: rename text-white to text-gray-1 across live components"
```

---

## Task 6: Verify the whole site in both themes

**Goal:** Confirm the theme toggle actually works end-to-end and nothing regressed in dark mode.

**Files:** none (verification only; fix forward in the relevant file from Tasks 1–5 if something's found broken, then re-run this task).

**Acceptance Criteria:**
- [ ] `npm run build` succeeds.
- [ ] Dark mode (default, fresh `localStorage`) looks identical to how the site looked before this plan — same colors throughout.
- [ ] Clicking the header's theme toggle switches the whole page to light colors instantly, including: background, all text, borders, both logos (dark logo now visible, light logo hidden), the amber/emerald/violet module-platform tags, the accent-colored buttons, the active-nav-link underline color, and the card/button hover states.
- [ ] Reloading the page after toggling to light keeps it light (no flash of dark first).
- [ ] The theme toggle button itself is visible and clickable on a narrow (375px) viewport, not just desktop.
- [ ] The QR/ЮMoney support modal still opens/closes correctly in both themes, and its brand-purple ЮMoney button stays the same fixed purple in both.
- [ ] `dist/news.json` still returns `[]` (unrelated to this plan, but confirms nothing else broke).

**Verify:** `cd abr-move && npm run build` → exits 0. Manual walkthrough via `npm run dev` covering every criterion above, in a real browser, at both 375px and 1440px widths, toggling the theme at each.

**Steps:**

- [ ] **Step 1: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0.

- [ ] **Step 2: Manual walkthrough**

Run: `cd abr-move && npm run dev`, open `http://127.0.0.1:4321`. Work through every Acceptance Criterion above. Fix forward in the appropriate file if anything fails, then re-run Step 1.

- [ ] **Step 3: Final commit (only if fixes were needed in this task)**

```bash
cd abr-move
git add -A
git commit -m "fix: address light/dark theme regressions found in manual review"
```

(Skip this step if Step 2 found nothing to fix.)

---

## Self-Review Notes

- **Spec coverage:** Token table → Task 1. `text-white`/`gray-1` consolidation → Task 5. `.btn-white` fix → Task 1 (`global.css`). Component-layer CSS updates → Task 1. Logo dark/light swap → Tasks 3 & 4 (markup) + Task 1 (the shared CSS rule). Header toggle button → Task 3. `Layout.astro` blocking script → Task 2. Out-of-scope items (dead components, Hero's decorative SVG, ЮMoney button) → explicitly excluded in Tasks 3, 5, and noted in Task 6's acceptance criteria.
- **Placeholder scan:** No TBD/TODO. Every hex value, variable name, and rename target is spelled out.
- **Type consistency:** The CSS variable names (`--color-base`, `--color-accent-rgb`, etc.) are identical between Task 1's `global.css` definitions and every later reference (Header's `<style>` block in Task 3, the scroll-spy script's `var(--color-accent)` in Task 3). The `localStorage` key `'abr-move-theme'` is used identically in Task 2 (read) and Task 3 (write) — deliberately not sp42's `'sp42-theme'` key, since they're different pages a visitor may want different preferences for (see spec). The class names `.logo-for-dark`/`.logo-for-light` are defined once in Task 1 and used identically in Tasks 3 and 4.
