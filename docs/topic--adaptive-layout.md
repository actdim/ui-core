---
protocol: along
slug: adaptive-layout
title: Adaptive Layout and Back-Stack Navigation (LayoutService, BackStackService)
type: reference
created: 2026-10-15
updated: 2026-10-15
tags: [layout, tiers, safe-area, backstack, navigation, dynstruct, msgmesh]
---

# Adaptive Layout and Back-Stack Navigation (LayoutService, BackStackService)

`@actdim/ui-core/layout` provides responsive screen tier classification, pointer detection, safe area inset propagation, and prioritized hardware/gesture Back-Stack management for Actdim applications.

---

## 1. Screen Tiers & Viewport Boundaries

The layout engine categorizes viewports into three semantic tiers, aligned with Tailwind v4 thresholds and Material UI breakpoints:

| Tier | Viewport Width | Description & UI Expectations |
| --- | --- | --- |
| `compact` | `< 768px` (under md) | Phone layout: single-column views, bottom navigation bar, full-screen dialogs, bottom sheets (`ActionSheet`). |
| `medium` | `768px - 1023px` (md to lg) | Tablet / foldable layout: compact multi-pane layouts, floating dialogs, side rails. |
| `expanded` | `>= 1024px` (lg and above) | Desktop layout: persistent sidebars, wide content containers, floating centered dialogs. |

### DOM Attributes and CSS Hooks

`LayoutService` automatically synchronizes the active layout with `document.documentElement` attributes:
- `data-tier="compact" | "medium" | "expanded"`: Enables tier-targeted CSS rules and Tailwind variant hooks (`compact:hidden`, `expanded:flex`).
- `data-pointer="coarse" | "fine"`: Reflects primary input capability (`(pointer: coarse)` vs `(pointer: fine)`). Used to enforce 44px minimum touch targets on mobile devices.
- `data-keyboard="visible"`: Set when the mobile virtual keyboard is active (detected via `window.visualViewport` height compression or text input focus on compact tier). Used to hide bottom navigation bars, floating buttons, and fixed bars that collide with the on-screen keyboard.

---

## 2. Safe Area Insets & CSS Custom Properties

`applySafeAreaToCssVariables` updates CSS custom properties on `:root` to ensure UI elements do not collide with notches, home indicator bars, or system status bars:

- `--safe-top`: Safe area inset top in pixels (default `0px`).
- `--safe-bottom`: Safe area inset bottom in pixels (default `0px`).
- `--safe-left`: Safe area inset left in pixels (default `0px`).
- `--safe-right`: Safe area inset right in pixels (default `0px`).
- `--toast-bottom-offset`: Dynamically computed bottom offset for toasts and floating action buttons (automatically set to `calc(var(--spacing-bottom-nav) + env(safe-area-inset-bottom, 0px))` on `compact` tier).

### Utility Classes

`@actdim/ui-core/theme.css` exports canonical Tailwind v4 utilities out of the box:
- `pt-safe`: `padding-top: max(env(safe-area-inset-top, 0px), var(--safe-top, 0px))`
- `pb-safe`: `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--safe-bottom, 0px))`
- `pl-safe`: `padding-left: max(env(safe-area-inset-left, 0px), var(--safe-left, 0px))`
- `pr-safe`: `padding-right: max(env(safe-area-inset-right, 0px), var(--safe-right, 0px))`

---

## 3. Responsive Breakpoint Rules (Tier Variants vs Tailwind Breakpoints)

To prevent visual and behavioral desynchronization on mobile devices:
1. **Layout-Shape Invariant**: Structural layout changes (showing/hiding toolbars, switching drawer vs header, bottom sheet vs dialog, 1-pane vs 2-pane) MUST use tier variants (`compact:`, `medium:`, `expanded:`) or `m.tier`.
2. **Tailwind `sm:` Prohibition for Structure**: Standard Tailwind `sm:` (640px) falls inside `compact` (<768px). A phone in landscape (e.g. 667x375 or 740x360) is `compact` in JS (`m.tier === 'compact'`). Using `sm:hidden` or `sm:flex` causes desktop-style controls to appear while menus remain bottom sheets. `sm:` is forbidden for visibility/layout toggles.
3. **Internal Density Permitted**: Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`) are permitted solely for fine-grained internal grid density (such as `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`).

---

## 4. LayoutService Architecture

`LayoutService` is a Dynstruct service managing viewport resizing, orientation, pointer detection, and virtual keyboard state:

### Public API

- `getCurrentLayout()`: Synchronously returns the cached `LayoutInfo` `{ tier, pointer, orientation, safeArea, keyboardVisible }`.
- `resolveCurrentLayout()`: Evaluates `window.innerWidth`, media queries, platform safe area insets, and `visualViewport` to produce fresh `LayoutInfo`.
- `applyLayoutAttributesToHtml(layout)`: Updates `data-tier`, `data-pointer`, and `data-keyboard` on `document.documentElement`.
- `applySafeAreaToCssVariables(insets)`: Injects `--safe-*` variables into `:root`.
- `initLayoutService(msgBus)`: Wires `window.resize`, `matchMedia`, `visualViewport`, and focus listeners, updating HTML attributes and publishing layout updates.

### MsgMesh Event Contracts

- `APP.LAYOUT.CHANGED`: Broadcast channel (`out`) published when screen tier, pointer kind, orientation, or safe area changes.
- `APP.LAYOUT.SET_SAFE_AREA`: Request channel (`in`) allowing host shells (e.g. MAUI mobile shell) to push updated device safe area insets into the web layer.

---

## 4. BackStackService & Prioritized Navigation

Mobile platforms (Android hardware Back button, iOS swipe-to-back, MAUI bridge) and desktop environments (Escape key) require predictable modal dismissal before page navigation. `BackStackService` provides a priority-ordered handler queue.

### Priority Queue Contract

Handlers are executed in descending order of `priority`. If a handler returns `true`, execution stops (the back event was handled). If it returns `false`, execution cascades down to the next handler.

| Component / Layer | Recommended Priority | Behavior |
| --- | --- | --- |
| Context menus & dropdowns (`AdaptiveMenu`) | `300` | Closes active menu popup. |
| Modal dialogs (`AdaptiveDialog`, `ActionSheet`) | `100` | Dismisses overlay (`open = false`). |
| In-page selection / search modes | `50` | Clears selection or search filter. |
| Root unhandled back handler | `0` (or fallback) | Navigates history backward or requests app minimization. |

### Registration & Lifecycle

- `registerBackHandler(handler)`: Queues a handler `{ id, priority, handle }`. Safe to call before MsgMesh is initialized.
- `unregisterBackHandler(id)`: Removes a registered handler. Overlays unregister in `onClose` and `onDestroy`.
- `setUnhandledBackHandler(fn)`: Configures the final fallback action when no queued handler handles the back event.

### MsgMesh Channels

- `APP.HOST.BACK`: Triggered by native shell bridge or browser Escape event. Dispatches to top-priority back handler.
- `APP.NAV.BACK`: Application navigation back command.
- `APP.NAV.CAN_GO_BACK`: Broadcasts whether any back handler or history step is available.
