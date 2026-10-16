---
protocol: along
slug: adaptive-overlays
title: Adaptive Overlays (AdaptiveDialog, ActionSheet, AdaptiveMenu)
type: reference
created: 2026-10-15
updated: 2026-10-15
tags: [overlays, dialogs, drawers, menus, backstack, dynstruct]
---

# Adaptive Overlays (AdaptiveDialog, ActionSheet, AdaptiveMenu)

`@actdim/ui-core/components` provides responsive, platform-adaptive modal and overlay components:
- `AdaptiveDialog`: Full-screen modal with sticky header on compact devices; centered dialog on medium and expanded viewports.
- `ActionSheet`: Bottom-sheet drawer optimized for touch and mobile tiers with drag gestures and accessible action lists.
- `AdaptiveMenu`: Responsive context and action menu rendering an `ActionSheet` on mobile and a positioned desktop `Menu` on larger screens.

---

## 1. Core Principles

1. **Declared as children of the host component**:
   Overlays are defined inside `def.children` via their hook constructor (`useAdaptiveDialog`, `useActionSheet`, `useAdaptiveMenu`) and rendered in `view` as `<c.children.OverlayName />` without props or inline event handlers in JSX.

2. **Self-closing and Two-Way Binding**:
   Overlays dismiss themselves internally upon backdrop click, close button tap, or Escape key. The host manages and observes visibility through a two-way binding on `open`:
   - `bindProp(() => m, 'isDialogOpen')` for direct model synchronization.
   - `bind(get, set)` when dismissal triggers custom cleanup logic (e.g. resetting anchor element).

3. **Standard `onClose?: () => void` Contract**:
   In addition to two-way `open` synchronization, overlay components accept an optional `onClose` callback in `def.props` to allow host components to execute side effects upon dismissal.

4. **Hardware Back Button Handling**:
   All adaptive overlay components automatically register a hardware Back button / Escape handler (`registerBackHandler`) with prioritized execution while `open` is `true`. Handlers are cleanly deregistered when closed or on component destruction (`events.onDestroy`).

5. **Live Content via Fragment Children**:
   Overlay bodies, headers, and actions are passed using reactive bindings (`bind(() => <c.children.DialogBody />)`) referencing host fragment children (`React.FC`). This guarantees live reactivity without stale closures.

---

## 2. Component Reference

### AdaptiveDialog
- **Props**:
  - `open: boolean`
  - `onClose?: () => void`
  - `title?: React.ReactNode`
  - `subtitle?: React.ReactNode`
  - `tier?: LayoutTier` (defaults to current layout tier)
  - `fullScreen?: boolean`
  - `maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false`
  - `fullWidth?: boolean`
  - `children?: React.ReactNode`
  - `actions?: React.ReactNode`
  - `primaryAction?: React.ReactNode`
  - `contentClassName?: TwClasses`
  - `paperClassName?: TwClasses`
  - `backHandlerPriority?: number` (default: 100)
  - `backHandlerId?: string`

### ActionSheet
- **Props**:
  - `open: boolean`
  - `onClose?: () => void`
  - `title?: string`
  - `actions: MenuItemAction[]`

### AdaptiveMenu
- **Props**:
  - `open: boolean`
  - `onClose?: () => void`
  - `tier: LayoutTier`
  - `anchorEl?: HTMLElement | null`
  - `anchorPosition?: { top: number; left: number }`
  - `title?: string`
  - `actions: MenuItemAction[]`
