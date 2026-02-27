# Split-Ledger Design System (V2)

A comprehensive visual language and component library for the Split-Ledger platform, designed to convey trust, high performance, and developer-centric precision.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [AI Consistency Guard](#ai-consistency-guard)
3. [Color Palette (V2)](#color-palette-v2)
4. [Typography](#typography)
5. [Elevation & Glassmorphism](#elevation--glassmorphism)
6. [Animation & Interactions](#animation--interactions)
7. [Component Patterns](#component-patterns)

---

## Design Philosophy

The V2 aesthetic shifts from a standard "Indigo/Slate" template to a highly premium, modern "Micro-SaaS" identity. It draws inspiration from top-tier developer platforms (like Vercel, Stripe, and Linear).

**Core Tenets:**
- **Dark Mode Native:** The default experience is a deep, sophisticated dark mode (`bg-zinc-950`), providing high contrast for code snippets, charts, and data tables.
- **Glassmorphism:** Strategic use of `backdrop-blur` and translucent backgrounds (`bg-white/5` or `bg-zinc-900/50`) with subtle 1px inner borders (`border-white/10`) to create depth without heavy drop shadows.
- **Vibrant Accents:** Muted backgrounds are punctuated by high-vibrancy accent gradients (Electric Violet, Neon Cyan) to guide attention to primary actions (CTAs, active states, key metrics).
- **Micro-Interactions:** Elements should respond beautifully to user input. Hover states should feature slight scaling, border glows, or GSAP-driven stagger reveals.

---

## AI Consistency Guard

> **IMPORTANT**: AI assistants generating or modifying UI code MUST adhere to the following rules to maintain the V2 aesthetic:

```text
1. AVOID raw Tailwind colors for primary surfaces. Use `zinc` instead of `slate` or `gray` for a cooler, more modern dark mode.
2. BACKGROUNDS: Main page surfaces should be `bg-zinc-950` or `#0a0a0f`.
3. PANELS/CARDS: Use glassmorphism.
   Example: `bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-xl`
4. PRIMARY BUTTONS/CTAs: Use Electric Violet/Fuchsia gradients.
   Example: `bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25`
5. SECONDARY BUTTONS: Use translucent borders.
   Example: `bg-white/5 hover:bg-white/10 border border-white/10 text-white`
6. TYPOGRAPHY: Primary marketing headers use `tracking-tight`. Financial numbers use `font-mono tracking-tighter`.
7. ANIMATION: Import `gsap` for enter animations on dashboards. Use `transition-all duration-300` for simple hover states.
```

---

## Color Palette (V2)

### 1. Base (Zinc)
Forms the foundation of the dark-mode UI. Cooler and more premium than Slate.
- `bg-zinc-950` (#09090b) - Main application background.
- `bg-zinc-900` (#18181b) - Sidebar and secondary header backgrounds.
- `border-zinc-800/50` - Standard subtle dividers.

### 2. Accents (Electric Violet & Fuchsia)
Used for primary actions, active navigation states, and highlights.
- `violet-600` (#7c3aed)
- `fuchsia-600` (#c026d3)
- *Gradient Pair:* `from-violet-600 to-fuchsia-600`

### 3. Semantic Colors
- **Success/Money (Emerald):** `text-emerald-400`, `bg-emerald-500/10 border-emerald-500/20`
- **Warning (Amber):** `text-amber-400`, `bg-amber-500/10`
- **Danger/Destructive (Rose):** `text-rose-500`, `bg-rose-500/10`
- **Info (Cyan):** `text-cyan-400`, `bg-cyan-500/10`

---

## Typography

### Families
- **Sans-Serif (Primary):** Inter, UI Default. Clean, readable at small sizes.
- **Display/Headings:** Inter with `tracking-tight` and `font-extrabold` for landing pages.
- **Monospace:** JetBrains Mono or standard system-mono for API Keys, amounts, and code blocks.

### Hierarchy Rules
- **Marketing H1:** `text-5xl lg:text-7xl font-extrabold tracking-tighter`
- **Dashboard Page Title:** `text-2xl font-bold tracking-tight text-white`
- **Card Titles:** `text-sm font-semibold tracking-wide text-zinc-300 uppercase`
- **Body:** `text-sm text-zinc-400 leading-relaxed`

---

## Elevation & Glassmorphism

Instead of heavy CSS shadows, V2 relies on "Glass" layers and translucent borders stacked on top of the deep `zinc-950` background.

**The "Standard Card" Pattern:**
```html
<div className="relative bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden">
  <!-- Optional inner glow ring for top-edge light reflection -->
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  <!-- Content -->
</div>
```

**Floating Navigation/Header:**
`bg-zinc-950/60 backdrop-blur-2xl border-b border-white/5`

---

## Animation & Interactions

1. **GSAP Staggering:** Dashboards and complex lists should never just "appear." Use a `useEffect` with `gsap.fromTo` to stagger list items fading in and moving up `y: 20` over 0.5s.
2. **Button Hovers:** Primary buttons should slightly scale up (`hover:scale-[1.02]`) and intensify their drop shadow (`hover:shadow-violet-500/40`).
3. **Card Hovers:** Interactive cards should boost their border opacity `hover:border-white/20` and elevate slightly.

---

## Component Patterns

### Inputs & Forms
Forms must look pristine and trustworthy.
- **Base Input:** `bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all`

### Data Tables
- Header row is distinct: `bg-zinc-900 border-b border-white/10` with `text-xs uppercase tracking-wider text-zinc-500`.
- Rows: `border-b border-white/5 hover:bg-white/[0.02] transition-colors`.

### Badges / Tags
Soft, pill-shaped tags for statuses or roles.
- **Active:** `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium`
- **Developer/Admin:** `bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium`
