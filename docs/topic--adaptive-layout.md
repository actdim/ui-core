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

---

## 2. Safe Area Insets & CSS Custom Properties

`applySafeAreaToCssVariables` updates CSS custom properties on `:root` to ensure UI elements do not collide with notches, home indicator bars, or system status bars:

- `--safe-top`: Safe area inset top in pixels.
- `--safe-bottom`: Safe area inset bottom in pixels.
- `--safe-left`: Safe area inset left in pixels.
- `--safe-right`: Safe area inset right in pixels.
- `--toast-bottom-offset`: Dynamically computed bottom offset for toasts and floating action buttons (e.g. above bottom navigation on `compact` tier).

### Utility Classes

Applications use standard CSS utility classes configured in `global.css`:
- `pt-safe`: `padding-top: max(env(safe-area-inset-top, 0px), var(--safe-top, 0px))`
- `pb-safe`: `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--safe-bottom, 0px))`

---

## 3. LayoutService Architecture

`LayoutService` is a Dynstruct service managing viewport resizing, orientation, and pointer detection:

### Public API

- `getCurrentLayout()`: Synchronously returns the cached `LayoutInfo` `{ tier, pointer, orientation, safeArea }`.
- `resolveCurrentLayout()`: Evaluates `window.innerWidth`, media queries, and platform safe area insets to produce fresh `LayoutInfo`.
- `applyLayoutAttributesToHtml(layout)`: Updates `data-tier` and `data-pointer` on `document.documentElement`.
- `applySafeAreaToCssVariables(insets)`: Injects `--safe-*` variables into `:root`.
- `initLayoutService(msgBus)`: Wires `window.resize` and `matchMedia` listeners, updating HTML attributes and publishing layout updates.

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
