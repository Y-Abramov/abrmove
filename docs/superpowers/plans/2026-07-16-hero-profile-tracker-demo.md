# Hero Profile Tracker Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the passive watermark decoration in the abr-move hero with a small, live-looking Profile Tracker HUD panel (moving cursor, real-time chainage/elevation/slope readout) on desktop, matching the reference mockup.

**Architecture:** New self-contained Astro component `HeroDemo.astro` renders an SVG road-profile plot with server-computed initial readout values (no JS required to look correct on first paint), then a small vanilla-JS `<script>` (via Astro's `define:vars`) animates the marker and live-updates the readout. `Hero.astro` switches to a two-column grid at `lg` and up and drops the old full-width watermark/road-SVG decoration.

**Tech Stack:** Astro 5 (`.astro` components, frontmatter runs at build time), Tailwind (existing `tailwind.config.mjs` tokens — `base`/`surface`/`elevated`/`line`/`gray-*`/`accent`), vanilla JS (no client framework, no dependencies), no test runner in this project — verification is `npm run build` (catches template/type errors) plus a manual visual check via `npm run dev`.

**User decisions (already made):**
- Redesign target: abr-move hero, not a new site (design already liked; this is a specific improvement, not a rebuild).
- HUD panel hidden entirely below `lg` (1024px) — no compact mobile variant.
- Numbers in the panel are synthetic/illustrative, not real project data.

---

## File Structure

- **Create** `src/components/HeroDemo.astro` — the HUD panel: SVG plot (two static polylines), server-computed initial marker/readout, client script for motion. Single responsibility: render + animate the demo widget. Nothing outside this file needs to know its internals beyond `<HeroDemo />`.
- **Modify** `src/components/Hero.astro` — import and place `HeroDemo`, switch content wrapper to a two-column grid at `lg`, remove the full-width watermark logo and road-SVG blocks, move a dimmed road-SVG backdrop into the new right column only.

No other files change. `global.css` and `tailwind.config.mjs` already have every token this needs (`bg-surface`, `bg-elevated`, `border-line`, `text-gray-1/2/3`, `text-accent`, `font-mono`, `tracking-widest2`) — nothing new to add there.

---

## Task 1: Build `HeroDemo.astro` — static structure with server-computed values

**Goal:** Create the HUD panel component with correct, server-rendered chainage/elevation/slope numbers and no client JS yet — it should look right on first paint even with JavaScript disabled.

**Files:**
- Create: `src/components/HeroDemo.astro`

**Acceptance Criteria:**
- [ ] `npm run build` succeeds with no errors.
- [ ] Rendered (in `npm run dev`, viewed standalone by temporarily adding `<HeroDemo />` to any page, or after Task 3 wiring) panel shows: header row "ABR | Profile Tracker" + "Слежение включено", an SVG with two polylines (ground + design) over a grid pattern, a dashed cursor line, a filled marker circle, and a readout box.
- [ ] Readout box shows exactly: station `ПК 121+75.00`, `Отметка проекта` `132.22`, `Отметка сущ.` `131.33`, `Рабочая отметка` `-0.89`, `Уклон, ‰` `12.7`, `До ПК` `25.00 м` (these are the values computed below for the fixed midpoint marker position — see Steps).

**Verify:** `cd abr-move && npm run build` → exits 0, no Astro/TS diagnostics.

**Steps:**

- [ ] **Step 1: Create the component file**

```astro
---
// src/components/HeroDemo.astro
//
// Illustrative Profile Tracker HUD — the numbers are synthetic, computed
// from hand-authored SVG curves, not a real survey. See docs/superpowers/
// specs/2026-07-16-hero-profile-tracker-demo-design.md for the design.

// SVG-space (viewBox "0 0 440 260") control points for the two curves.
const designPoints = [
  { x: 20, y: 90 },
  { x: 80, y: 110 },
  { x: 140, y: 150 },
  { x: 200, y: 175 },
  { x: 260, y: 160 },
  { x: 320, y: 130 },
  { x: 380, y: 115 },
  { x: 420, y: 120 },
];

const groundPoints = [
  { x: 20, y: 78 },
  { x: 60, y: 100 },
  { x: 100, y: 95 },
  { x: 140, y: 140 },
  { x: 180, y: 165 },
  { x: 220, y: 190 },
  { x: 260, y: 155 },
  { x: 300, y: 145 },
  { x: 340, y: 118 },
  { x: 380, y: 100 },
  { x: 420, y: 108 },
];

const designPointsStr = designPoints.map((p) => `${p.x},${p.y}`).join(' ');
const groundPointsStr = groundPoints.map((p) => `${p.x},${p.y}`).join(' ');

// Maps SVG x/y <-> route chainage (m) / elevation (m). Route runs
// ПК120+00 -> ПК123+50 (350 m) left to right across the plot.
const plotBounds = {
  xMin: 20,
  xMax: 420,
  routeStartM: 12000, // "ПК120+00" as metres from a notional km 0
  routeLengthM: 350,
  yMin: 40,
  yMax: 220,
  elevAtYMin: 138.0,
  elevAtYMax: 130.0,
};

function interpolateY(points: { x: number; y: number }[], x: number) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + t * (b.y - a.y);
    }
  }
  return points[points.length - 1].y;
}

function xToChainageM(x: number, bounds: typeof plotBounds) {
  return ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * bounds.routeLengthM;
}

function yToElevation(y: number, bounds: typeof plotBounds) {
  const t = (y - bounds.yMin) / (bounds.yMax - bounds.yMin);
  return bounds.elevAtYMin + t * (bounds.elevAtYMax - bounds.elevAtYMin);
}

function formatStation(meters: number, bounds: typeof plotBounds) {
  const totalM = bounds.routeStartM + meters;
  const picket = Math.floor(totalM / 100);
  const offset = totalM - picket * 100;
  return `ПК ${picket}+${offset.toFixed(2).padStart(5, '0')}`;
}

function formatSignedFixed(v: number, digits: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}`;
}

function slopePerMille(points: { x: number; y: number }[], x: number, bounds: typeof plotBounds) {
  const dx = 6;
  const x0 = Math.max(bounds.xMin, x - dx);
  const x1 = Math.min(bounds.xMax, x + dx);
  const elev0 = yToElevation(interpolateY(points, x0), bounds);
  const elev1 = yToElevation(interpolateY(points, x1), bounds);
  const dxMeters = xToChainageM(x1, bounds) - xToChainageM(x0, bounds);
  return ((elev1 - elev0) / dxMeters) * 1000;
}

function distanceToNextStationM(meters: number, bounds: typeof plotBounds) {
  const totalM = bounds.routeStartM + meters;
  const offset = totalM % 100;
  return 100 - offset;
}

// Initial marker position: horizontal midpoint of the plot.
const initialX = (plotBounds.xMin + plotBounds.xMax) / 2;
const initialDesignY = interpolateY(designPoints, initialX);
const initialGroundY = interpolateY(groundPoints, initialX);
const initialMeters = xToChainageM(initialX, plotBounds);
const initialDesignElev = yToElevation(initialDesignY, plotBounds);
const initialGroundElev = yToElevation(initialGroundY, plotBounds);
const initialWorking = initialGroundElev - initialDesignElev;
const initialSlope = slopePerMille(designPoints, initialX, plotBounds);
const initialDist = distanceToNextStationM(initialMeters, plotBounds);
---

<div class="relative border border-line bg-surface" aria-hidden="true">
  <div class="flex items-center justify-between px-4 py-3 border-b border-line">
    <span class="font-mono text-[10px] tracking-widest2 uppercase text-gray-2">ABR | Profile Tracker</span>
    <span class="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest2 uppercase text-accent">
      <span class="relative flex w-1.5 h-1.5">
        <span class="hero-demo-pulse absolute inset-0 rounded-full bg-accent"></span>
        <span class="relative rounded-full w-1.5 h-1.5 bg-accent"></span>
      </span>
      Слежение включено
    </span>
  </div>

  <div class="relative px-4 py-4">
    <svg id="hero-demo-svg" viewBox="0 0 440 260" class="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="hero-demo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1C1F2E" stroke-width="1"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="440" height="260" fill="url(#hero-demo-grid)" />

      <polyline points={groundPointsStr} fill="none" stroke="#42466A" stroke-width="1.5" />
      <polyline points={designPointsStr} fill="none" stroke="#22D3EE" stroke-width="2" />

      <line id="hero-demo-cursor-line" x1={initialX} y1="20" x2={initialX} y2="240" stroke="#888BA8" stroke-width="1" stroke-dasharray="4 4" />
      <circle id="hero-demo-marker" cx={initialX} cy={initialDesignY} r="4" fill="#22D3EE" stroke="#09090E" stroke-width="2" />
    </svg>

    <div id="hero-demo-readout" class="absolute bottom-3 right-3 bg-elevated border border-line px-3 py-2.5 font-mono text-[10px] leading-relaxed text-gray-2 min-w-[168px]">
      <div class="flex items-center justify-between gap-4 text-white font-medium mb-1.5">
        <span id="hero-demo-station">{formatStation(initialMeters, plotBounds)}</span>
      </div>
      <div class="flex items-center justify-between gap-4"><span>Отметка проекта</span><span id="hero-demo-elev-design" class="text-gray-1">{initialDesignElev.toFixed(2)}</span></div>
      <div class="flex items-center justify-between gap-4"><span>Отметка сущ.</span><span id="hero-demo-elev-ground" class="text-gray-1">{initialGroundElev.toFixed(2)}</span></div>
      <div class="flex items-center justify-between gap-4"><span>Рабочая отметка</span><span id="hero-demo-elev-working" class="text-gray-1">{formatSignedFixed(initialWorking, 2)}</span></div>
      <div class="flex items-center justify-between gap-4"><span>Уклон, ‰</span><span id="hero-demo-slope" class="text-gray-1">{initialSlope.toFixed(1)}</span></div>
      <div class="flex items-center justify-between gap-4"><span>До ПК</span><span id="hero-demo-dist" class="text-gray-1">{initialDist.toFixed(2)} м</span></div>
    </div>
  </div>
</div>

<style>
  @keyframes hero-demo-ping {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  .hero-demo-pulse {
    animation: hero-demo-ping 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-demo-pulse { animation: none; }
  }
</style>
```

- [ ] **Step 2: Verify the computed values match the acceptance criteria by hand (already worked out above; the numbers in the AC are the actual output of this code for `initialX = 220`)**

No separate test — this is a static Astro component in a project with no test runner. Task 3 gives it somewhere to render so it can be checked visually; this task's correctness gate is the build.

- [ ] **Step 3: Build**

Run: `cd abr-move && npm run build`
Expected: build completes with no errors (the component isn't imported anywhere yet, so Astro won't even type-check it into a page — this step mainly confirms no syntax errors via `astro check`-style parsing if the build performs it; the real check happens after Task 3 wires it in). If `npm run build` doesn't surface issues in unused files, that's fine — Task 3's build step is the real gate for this file.

- [ ] **Step 4: Commit**

```bash
cd abr-move
git add src/components/HeroDemo.astro
git commit -m "feat: add static HeroDemo profile-tracker HUD component"
```

---

## Task 2: Add motion — auto-drift, hover-follow, reduced-motion

**Goal:** Make the marker move: idle auto-drift loop, mouse-follow on hover, respecting `prefers-reduced-motion`.

**Files:**
- Modify: `src/components/HeroDemo.astro` (add a `<script>` block at the end of the template)

**Acceptance Criteria:**
- [ ] With motion allowed and no interaction, the marker visibly drifts left-to-right then back, over the SVG, roughly an 8s one-way pass, pausing briefly at each end.
- [ ] Moving the mouse over the SVG makes the marker follow the horizontal mouse position (clamped to the plot's x-range); the readout numbers update live as it moves.
- [ ] Leaving the SVG resumes the auto-drift after a short delay.
- [ ] With `prefers-reduced-motion: reduce` (test via browser devtools "Emulate CSS media feature `prefers-reduced-motion`"), the marker does not auto-drift (stays at its server-rendered initial position until/unless the user hovers), but hover-follow still works.

**Verify:** `cd abr-move && npm run build` → exits 0. Manual check per criteria above via `npm run dev`.

**Steps:**

- [ ] **Step 1: Add the animation script**

Add this block right before the closing `</div>` of the component is not right — add it as a sibling after the outer `<div class="relative border border-line bg-surface" ...>` block and after the existing `<style>` block, i.e. append at the end of the file:

```astro
<script define:vars={{ designPoints, groundPoints, plotBounds }}>
  function interpolateY(points, x) {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (x >= a.x && x <= b.x) {
        const t = (x - a.x) / (b.x - a.x);
        return a.y + t * (b.y - a.y);
      }
    }
    return points[points.length - 1].y;
  }

  function xToChainageM(x, bounds) {
    return ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * bounds.routeLengthM;
  }

  function yToElevation(y, bounds) {
    const t = (y - bounds.yMin) / (bounds.yMax - bounds.yMin);
    return bounds.elevAtYMin + t * (bounds.elevAtYMax - bounds.elevAtYMin);
  }

  function formatStation(meters, bounds) {
    const totalM = bounds.routeStartM + meters;
    const picket = Math.floor(totalM / 100);
    const offset = totalM - picket * 100;
    return `ПК ${picket}+${offset.toFixed(2).padStart(5, '0')}`;
  }

  function formatSignedFixed(v, digits) {
    return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}`;
  }

  function slopePerMille(points, x, bounds) {
    const dx = 6;
    const x0 = Math.max(bounds.xMin, x - dx);
    const x1 = Math.min(bounds.xMax, x + dx);
    const elev0 = yToElevation(interpolateY(points, x0), bounds);
    const elev1 = yToElevation(interpolateY(points, x1), bounds);
    const dxMeters = xToChainageM(x1, bounds) - xToChainageM(x0, bounds);
    return ((elev1 - elev0) / dxMeters) * 1000;
  }

  function distanceToNextStationM(meters, bounds) {
    const totalM = bounds.routeStartM + meters;
    const offset = totalM % 100;
    return 100 - offset;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  const svg = document.getElementById('hero-demo-svg');
  const marker = document.getElementById('hero-demo-marker');
  const cursorLine = document.getElementById('hero-demo-cursor-line');
  const stationEl = document.getElementById('hero-demo-station');
  const designEl = document.getElementById('hero-demo-elev-design');
  const groundEl = document.getElementById('hero-demo-elev-ground');
  const workingEl = document.getElementById('hero-demo-elev-working');
  const slopeEl = document.getElementById('hero-demo-slope');
  const distEl = document.getElementById('hero-demo-dist');

  if (svg && marker && cursorLine && stationEl && designEl && groundEl && workingEl && slopeEl && distEl) {
    const bounds = plotBounds;
    const { xMin, xMax } = bounds;

    function renderAt(x) {
      const designY = interpolateY(designPoints, x);
      const groundY = interpolateY(groundPoints, x);
      const meters = xToChainageM(x, bounds);
      const designElev = yToElevation(designY, bounds);
      const groundElev = yToElevation(groundY, bounds);
      const working = groundElev - designElev;
      const slope = slopePerMille(designPoints, x, bounds);
      const dist = distanceToNextStationM(meters, bounds);

      marker.setAttribute('cx', String(x));
      marker.setAttribute('cy', String(designY));
      cursorLine.setAttribute('x1', String(x));
      cursorLine.setAttribute('x2', String(x));
      stationEl.textContent = formatStation(meters, bounds);
      designEl.textContent = designElev.toFixed(2);
      groundEl.textContent = groundElev.toFixed(2);
      workingEl.textContent = formatSignedFixed(working, 2);
      slopeEl.textContent = slope.toFixed(1);
      distEl.textContent = `${dist.toFixed(2)} м`;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let hovering = false;
    let resumeTimeout = null;
    let rafId = null;

    const PASS_MS = 8000;
    const PAUSE_MS = 500;

    function driftLoop(startTime, fromX, toX) {
      function step(now) {
        if (hovering) return;
        const elapsed = now - startTime;
        if (elapsed < PAUSE_MS) {
          renderAt(fromX);
          rafId = requestAnimationFrame(step);
          return;
        }
        const t = Math.min(1, (elapsed - PAUSE_MS) / PASS_MS);
        const eased = easeInOutCubic(t);
        const x = fromX + (toX - fromX) * eased;
        renderAt(x);
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          rafId = requestAnimationFrame((n) => driftLoop(n, toX, fromX));
        }
      }
      rafId = requestAnimationFrame(step);
    }

    if (!reduceMotion) {
      requestAnimationFrame((now) => driftLoop(now, xMin, xMax));
    }

    function handlePointerMove(evt) {
      hovering = true;
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }
      const rect = svg.getBoundingClientRect();
      const viewBoxWidth = 440;
      const scale = viewBoxWidth / rect.width;
      const localX = (evt.clientX - rect.left) * scale;
      const clampedX = Math.min(xMax, Math.max(xMin, localX));
      renderAt(clampedX);
    }

    function handlePointerLeave() {
      resumeTimeout = setTimeout(() => {
        hovering = false;
        if (!reduceMotion) {
          if (rafId) cancelAnimationFrame(rafId);
          requestAnimationFrame((now) => driftLoop(now, xMin, xMax));
        }
      }, 300);
    }

    svg.addEventListener('pointermove', handlePointerMove);
    svg.addEventListener('pointerleave', handlePointerLeave);
  }
</script>
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0, no errors.

- [ ] **Step 3: Manual check**

Run: `cd abr-move && npm run dev`, temporarily render `<HeroDemo />` on any page (or proceed to Task 3 first and check it there — either order is fine since this task and Task 3 both touch the render path). Confirm the four Acceptance Criteria above in a real browser (including the devtools reduced-motion emulation check).

- [ ] **Step 4: Commit**

```bash
cd abr-move
git add src/components/HeroDemo.astro
git commit -m "feat: animate HeroDemo marker with auto-drift and hover-follow"
```

---

## Task 3: Wire `HeroDemo` into the hero, two-column layout

**Goal:** Render `HeroDemo` inside `Hero.astro` in a two-column desktop layout, remove the old full-width watermark/road-SVG decoration, keep mobile (`<lg`) exactly as it looks today.

**Files:**
- Modify: `src/components/Hero.astro` (full replacement below)

**Acceptance Criteria:**
- [ ] At `lg` (1024px) and above, hero shows two columns: existing text content on the left, `HeroDemo` panel on the right.
- [ ] Below `lg`, `HeroDemo` is not rendered (`hidden lg:block` — confirm via devtools that the component's root div has `display: none` under 1024px, not just visually hidden).
- [ ] The giant watermark logo (`opacity-[0.025]` full-bleed image) is gone from the page.
- [ ] The road-SVG decorative lines appear only behind the `HeroDemo` column, at `opacity-[0.04]` or lower.
- [ ] `npm run build` succeeds.
- [ ] Visual check in `npm run dev`: hero text, CTAs, and stats strip look unchanged from before at both mobile and desktop widths, aside from the new right column at desktop widths.

**Verify:** `cd abr-move && npm run build` → exits 0. Manual visual diff via `npm run dev` at 375px, 1024px, 1440px widths.

**Steps:**

- [ ] **Step 1: Replace `src/components/Hero.astro` with this full content**

```astro
---
import HeroDemo from './HeroDemo.astro';
---

<section id="hero" class="relative min-h-screen flex flex-col justify-center overflow-hidden bg-base pt-14">

  <!-- Fine grid background -->
  <div class="absolute inset-0 bg-grid-fine bg-grid-48 pointer-events-none opacity-100"></div>

  <!-- Accent glow — top center -->
  <div class="absolute inset-0 bg-glow-center pointer-events-none"></div>

  <!-- Content -->
  <div class="relative max-w-7xl mx-auto px-6 lg:px-8 w-full py-24 lg:py-32">
    <div class="grid lg:grid-cols-[1fr_480px] lg:gap-12 items-center">

      <!-- Left column: copy -->
      <div>
        <!-- Tag -->
        <div class="reveal flex items-center gap-3 mb-8">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 border border-accent-dim bg-accent-glow font-mono text-[10px] tracking-widest2 uppercase text-accent">
            <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
            Topomatic Robur · Civil 3D
          </span>
        </div>

        <!-- Headline -->
        <div class="mb-8">
          <h1 class="reveal reveal-delay-1 font-bold text-white leading-[1.05] tracking-tight"
              style="font-size: clamp(2.4rem, 5.5vw, 5rem);">
            Инструменты<br/>
            для проектирования<br/>
            <span class="text-gray-3">дорог в Topomatic<br/>Robur</span>
          </h1>
        </div>

        <!-- Subtitle -->
        <p class="reveal reveal-delay-2 text-gray-2 text-sm leading-relaxed max-w-lg mb-10 font-mono">
          Плагины и скрипты, которые ускоряют работу и&nbsp;экономят время инженера.
          Созданы практикующим проектировщиком.
        </p>

        <!-- CTAs -->
        <div class="reveal reveal-delay-3 flex flex-wrap items-center gap-3 mb-16">
          <a href="#downloads" class="btn-accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Скачать модули
          </a>
          <a href="#solutions" class="btn-outline">
            Подробнее
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </a>
        </div>

        <!-- Stats strip -->
        <div class="reveal reveal-delay-4 border-t border-line pt-8 grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-line">
          {[
            { v: '10+', l: 'лет опыта' },
            { v: '5', l: 'модулей' },
            { v: '50+', l: 'проектов' },
            { v: 'Free', l: 'для скачивания' },
          ].map((s) => (
            <div class="px-6 first:pl-0 flex flex-col gap-0.5">
              <span class="font-mono font-bold text-white text-xl">{s.v}</span>
              <span class="font-mono text-[11px] text-gray-3">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <!-- Right column: live HUD demo (desktop only) -->
      <div class="hidden lg:block relative reveal reveal-delay-2">
        <div class="absolute -inset-8 pointer-events-none select-none overflow-hidden opacity-[0.04]" aria-hidden="true">
          <svg viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg" class="absolute right-0 top-1/2 -translate-y-1/2 w-full h-full">
            <path d="M300 0 L80 800" stroke="white" stroke-width="2.5"/>
            <path d="M300 0 L520 800" stroke="white" stroke-width="2.5"/>
            <path d="M300 0 L300 800" stroke="white" stroke-width="1.5" stroke-dasharray="18 12"/>
            <path d="M300 0 L160 800" stroke="white" stroke-width="1" opacity="0.5"/>
            <path d="M300 0 L440 800" stroke="white" stroke-width="1" opacity="0.5"/>
          </svg>
        </div>
        <HeroDemo />
      </div>
    </div>
  </div>

  <!-- Bottom platforms strip -->
  <div class="relative border-t border-line bg-surface/40">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="flex items-center gap-0 divide-x divide-line overflow-x-auto">
        {['Topomatic Robur', 'Autodesk Civil 3D', 'BIM', 'Dynamo', '.NET / C#'].map((p) => (
          <span class="px-6 py-3 font-mono text-[11px] text-gray-3 whitespace-nowrap shrink-0">{p}</span>
        ))}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Build**

Run: `cd abr-move && npm run build`
Expected: exits 0, no errors, `dist/index.html` regenerated.

- [ ] **Step 3: Manual visual check**

Run: `cd abr-move && npm run dev`, open `http://127.0.0.1:4321`. Resize the browser through 375px, 1024px, 1440px and confirm all Acceptance Criteria above.

- [ ] **Step 4: Commit**

```bash
cd abr-move
git add src/components/Hero.astro
git commit -m "feat: wire HeroDemo into hero as two-column desktop layout"
```

---

## Self-Review Notes

- **Spec coverage:** Layout (two-column, `hidden lg:block`) → Task 3. Panel chrome (header label + pulsing status dot) → Task 1. Plot (two polylines, grid, cursor line, marker) → Task 1. Readout (6 fields, deterministic interpolation) → Task 1. Motion (auto-drift, hover-follow, reduced-motion) → Task 2. Accessibility (`aria-hidden`) → Task 1. All spec sections covered.
- **Placeholder scan:** none — every step has complete code, computed example values are worked out by hand in Task 1 rather than left as "TBD".
- **Type consistency:** `plotBounds`, `designPoints`, `groundPoints` and all element IDs (`hero-demo-svg`, `hero-demo-marker`, `hero-demo-cursor-line`, `hero-demo-station`, `hero-demo-elev-design`, `hero-demo-elev-ground`, `hero-demo-elev-working`, `hero-demo-slope`, `hero-demo-dist`) are identical between the Task 1 markup and the Task 2 script. Function names (`interpolateY`, `xToChainageM`, `yToElevation`, `formatStation`, `formatSignedFixed`, `slopePerMille`, `distanceToNextStationM`) match between the Astro frontmatter (Task 1, build-time) and the client script (Task 2, browser) — intentionally duplicated (frontmatter code isn't available to the browser), same logic in both.
