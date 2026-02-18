# Design System

A comprehensive visual language and component library for the Split-Ledger application.

## Table of Contents

1. [Overview](#overview)
2. [AI Consistency Guard](#ai-consistency-guard)
3. [Design Tokens](#design-tokens)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Color Palette](#color-palette)
7. [Components](#components)
8. [Usage Guidelines](#usage-guidelines)

---

## Overview

This design system provides a consistent visual language across the Split-Ledger application. It is built on a foundation of design tokens that are consumed by Tailwind CSS, ensuring that all values are derived from a single source of truth.

### Core Principles

1. **Token-First**: All design values must come from tokens. No arbitrary values.
2. **Accessible**: Components meet WCAG 2.1 AA standards.
3. **Consistent**: Patterns are reusable and predictable.
4. **Scalable**: The system grows with the application.

---

## AI Consistency Guard

> **IMPORTANT**: When generating or modifying UI code, AI assistants MUST follow these rules:

```
AI CONSISTENCY GUARD PROMPT:

When working with this design system, you MUST:

1. NEVER use arbitrary Tailwind values like:
   - w-[347px] → USE w-64, w-80, w-96 instead
   - text-[#ff0000] → USE text-danger-500 instead
   - p-[13px] → USE p-3, p-4 instead
   - rounded-[7px] → USE rounded-md, rounded-lg instead

2. ALWAYS import and use design tokens:
   - Colors: primary, secondary, accent, danger, warning, info
   - Typography: font-sans, font-mono, text-sm, text-lg, etc.
   - Spacing: p-4, m-2, gap-6 (based on 4px scale)
   - Radius: rounded-sm, rounded-md, rounded-lg, rounded-xl

3. USE the cn() utility for conditional classes:
   ```tsx
   import { cn } from '@/lib/utils';
   
   // Good
   <div className={cn('p-4 bg-white', isActive && 'bg-primary-50')} />
   
   // Bad
   <div className={`p-4 bg-white ${isActive ? 'bg-primary-50' : ''}`} />
   ```

4. IMPORT components from the barrel export:
   ```tsx
   // Good
   import { Button, Card, Input } from '@/components';
   
   // Bad
   import Button from '@/components/ui/Button';
   import Card from '@/components/ui/Card';
   ```

5. MAINTAIN component patterns:
   - All button variants use the same base styles
   - All inputs use the same size variants (sm/md/lg)
   - All cards use the same padding/shadow options

6. RESPECT accessibility requirements:
   - Always include aria-labels for icon-only buttons
   - Use aria-live for dynamic content
   - Ensure focus-visible states are present
   - Use semantic HTML elements

7. FOLLOW naming conventions:
   - Components: PascalCase (Button, InputField)
   - Props interfaces: ComponentNameProps
   - Utility functions: camelCase (cn, formatDate)
   - Token exports: camelCase (colors, typography)
```

---

## Design Tokens

Design tokens are the visual design atoms of the design system. They are named entities that store visual design attributes.

### Location

All tokens are defined in:
```
frontend/src/styles/tokens.ts
```

### Token Categories

| Category | Description |
|----------|-------------|
| `colors` | Primary, secondary, accent, danger, warning, info scales |
| `typography` | Font families, sizes, weights, line heights |
| `spacing` | 4px-based spacing scale (0-96) |
| `borderRadius` | Border radius values (none to full) |
| `boxShadow` | Shadow and focus ring styles |
| `zIndex` | Z-index scale for layering |
| `animation` | Animation keyframes and durations |

---

## Typography

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `font-sans` | Inter, system-ui, sans-serif | Body text, UI elements |
| `font-mono` | JetBrains Mono, monospace | Code, numbers |

### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | 16px | Small labels, badges |
| `text-sm` | 14px | 20px | Body small, inputs |
| `text-base` | 16px | 24px | Body text |
| `text-lg` | 18px | 28px | Large body, lead |
| `text-xl` | 20px | 28px | H4, card titles |
| `text-2xl` | 24px | 32px | H3 |
| `text-3xl` | 30px | 36px | H2 |
| `text-4xl` | 36px | 40px | H1 |
| `text-5xl` | 48px | 48px | Hero text |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, emphasis |
| `font-semibold` | 600 | Headings, buttons |
| `font-bold` | 700 | Strong emphasis |

---

## Spacing

The spacing scale is based on a 4px unit (0.25rem).

| Token | Pixels | Usage |
|-------|--------|-------|
| `0` | 0 | No spacing |
| `1` | 4px | Tight spacing |
| `2` | 8px | Small gaps |
| `3` | 12px | Medium-small |
| `4` | 16px | Default padding |
| `5` | 20px | Between elements |
| `6` | 24px | Section padding |
| `8` | 32px | Large padding |
| `10` | 40px | XL padding |
| `12` | 48px | XXL padding |
| `16` | 64px | Section margins |
| `20` | 80px | Page sections |
| `24` | 96px | Major sections |

---

## Color Palette

### Primary (Indigo)

Used for primary actions, active states, and emphasis.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | #eef2ff | Light backgrounds |
| `primary-100` | #e0e7ff | Hover states |
| `primary-200` | #c7d2fe | Borders |
| `primary-300` | #a5b4fc | Disabled |
| `primary-400` | #818cf8 | Icons |
| `primary-500` | #6366f1 | Focus rings |
| `primary-600` | #4f46e5 | Buttons (default) |
| `primary-700` | #4338ca | Buttons (hover) |
| `primary-800` | #3730a3 | Buttons (active) |
| `primary-900` | #312e81 | Text |
| `primary-950` | #1e1b4b | Dark text |

### Secondary (Slate)

Used for backgrounds, borders, and secondary elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary-50` | #f8fafc | Page background |
| `secondary-100` | #f1f5f9 | Hover backgrounds |
| `secondary-200` | #e2e8f0 | Borders |
| `secondary-300` | #cbd5e1 | Strong borders |
| `secondary-400` | #94a3b8 | Muted text |
| `secondary-500` | #64748b | Secondary text |
| `secondary-600` | #475569 | Body text |
| `secondary-700` | #334155 | Strong text |
| `secondary-800` | #1e293b | Dark backgrounds |
| `secondary-900` | #0f172a | Headings |

### Accent (Emerald)

Used for success states and positive indicators.

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-50` | #ecfdf5 | Success background |
| `accent-500` | #10b981 | Success icons |
| `accent-600` | #059669 | Success text |
| `accent-700` | #047857 | Success buttons |

### Danger (Red)

Used for errors, destructive actions, and warnings.

| Token | Hex | Usage |
|-------|-----|-------|
| `danger-50` | #fef2f2 | Error background |
| `danger-500` | #ef4444 | Error icons |
| `danger-600` | #dc2626 | Error text/buttons |
| `danger-700` | #b91c1c | Error buttons (hover) |

### Warning (Amber)

Used for cautionary states and alerts.

| Token | Hex | Usage |
|-------|-----|-------|
| `warning-50` | #fffbeb | Warning background |
| `warning-500` | #f59e0b | Warning icons |
| `warning-600` | #d97706 | Warning text |

### Info (Sky)

Used for informational states.

| Token | Hex | Usage |
|-------|-----|-------|
| `info-50` | #f0f9ff | Info background |
| `info-500` | #0ea5e9 | Info icons |
| `info-600` | #0284c7 | Info text |

---

## Components

### Button

| Variant | Usage |
|---------|-------|
| `PrimaryButton` | Main actions, CTAs |
| `SecondaryButton` | Secondary actions, cancel |
| `DangerButton` | Destructive actions |
| `GhostButton` | Tertiary actions, links |

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | px-3 py-1.5 | 14px |
| `md` | px-4 py-2 | 14px |
| `lg` | px-5 py-2.5 | 16px |

### Input

| Component | Usage |
|-----------|-------|
| `InputField` | Text inputs |
| `TextAreaField` | Multi-line text |
| `SelectField` | Dropdown selections |
| `SearchField` | Search inputs |

### Card

| Component | Usage |
|-----------|-------|
| `Card` | Base container |
| `CardHeader` | Header section |
| `CardTitle` | Card heading |
| `CardDescription` | Card description |
| `CardContent` | Main content |
| `CardFooter` | Footer actions |
| `StatCard` | Metrics display |
| `ActionCard` | Clickable navigation |

### Modal

| Component | Usage |
|-----------|-------|
| `Modal` | Base modal dialog |
| `ConfirmationModal` | Confirm/cancel dialogs |

### Badge

| Component | Usage |
|-----------|-------|
| `Badge` | Status labels |
| `DotIndicator` | Status dots |
| `ProgressBar` | Progress display |
| `StatusBadge` | Predefined statuses |

### Table

| Component | Usage |
|-----------|-------|
| `DataTable` | Data tables with sorting |

### Navigation

| Component | Usage |
|-----------|-------|
| `AppShell` | Layout wrapper |
| `SidebarNav` | Vertical navigation |
| `NavItem` | Navigation link |
| `TopBar` | Header bar |
| `Breadcrumb` | Breadcrumb trail |

### Loading

| Component | Usage |
|-----------|-------|
| `Skeleton` | Base skeleton |
| `SkeletonText` | Text placeholder |
| `SkeletonCard` | Card skeleton |
| `SkeletonTable` | Table skeleton |
| `SkeletonStat` | Stat card skeleton |
| `Spinner` | Loading spinner |
| `LoadingOverlay` | Full-page loading |

### Empty State

| Component | Usage |
|-----------|-------|
| `EmptyState` | No data display |
| `ErrorState` | Error display |
| `NoPermissionState` | Access denied |
| `NoDataState` | No data found |
| `NoSearchResultsState` | No search results |

### Toast

| Component | Usage |
|-----------|-------|
| `Toast` | Notification |
| `ToastContainer` | Toast stack |
| `ToastProvider` | Context provider |
| `useToast` | Hook for toasts |

### Form

| Component | Usage |
|-----------|-------|
| `Form` | Form wrapper |
| `FormSection` | Grouped fields |
| `FieldGroup` | Label + input + error |
| `FormDivider` | Section divider |
| `FormActions` | Button container |
| `FormRow` | Multi-column layout |

---

## Usage Guidelines

### Do's

✅ Use tokens for all design values
✅ Import from barrel exports
✅ Use the `cn()` utility for conditional classes
✅ Include accessibility attributes
✅ Follow component patterns consistently
✅ Test with keyboard navigation
✅ Use semantic HTML

### Don'ts

❌ Use arbitrary Tailwind values (w-[100px])
❌ Hardcode colors or spacing
❌ Skip accessibility attributes
❌ Create one-off component variants
❌ Use inline styles
❌ Break component patterns

---

## File Structure

```
frontend/src/
├── styles/
│   ├── tokens.ts          # Design tokens
│   └── global.css         # Global styles
├── components/
│   ├── index.ts           # Barrel export
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── Table.tsx
│       ├── Navigation.tsx
│       ├── Loading.tsx
│       ├── EmptyState.tsx
│       ├── Toast.tsx
│       ├── Form.tsx
│       ├── __tests__/      # Component tests
│       └── stories/        # Storybook stories
└── lib/
    └── utils.ts           # cn() utility
```

---

## Testing

All components include unit tests with 80%+ coverage requirements. Tests cover:

- Default rendering
- All variants and sizes
- States (loading, disabled, error)
- Accessibility attributes
- User interactions

Run tests with:
```bash
npm run test
npm run test:coverage
```

---

## Storybook

View all components in Storybook:
```bash
npm run storybook
```

Storybook provides:
- Visual documentation
- Interactive playground
- Accessibility testing
- Responsive previews
