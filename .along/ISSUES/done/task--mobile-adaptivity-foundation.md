---
protocol: along
protocol_version: "4.4.16"
slug: mobile-adaptivity-foundation
type: task
status: done
completed: 2026-10-17
priority: high
created: 2026-10-17
updated: 2026-10-17
agent: antigravity
tags: [ui-core, mobile, responsive, layout, safe-area, keyboard]
parent: task--mobile-adaptivity-ui-core-migration
blocked_by: []
related: []
---

# Expose safe area CSS utilities and keyboard avoidance in ui-core

## Background & Problem Statement

`@actdim/ui-core` defines responsive layout tiers, pointer detection, and adaptive overlays. However, several critical mobile adaptivity foundations remained incomplete or split between `ui-core` and downstream applications:

1. Safe area CSS variables (`--safe-*`) and `@utility pt-safe`, `@utility pb-safe`, `@utility pl-safe`, `@utility pr-safe` are documented in `ui-core` documentation, but their definitions were placed downstream in `webapp/src/global.css`. Consumers of `ui-core` did not receive safe area utility classes out of the box.
2. Virtual keyboard detection was duplicated downstream in `webapp/src/components/layout/BottomNav.tsx` rather than centrally managed in `LayoutService`.
3. Documentation in `ui-core` lacked clear guidance on resolving the conflict between `data-tier="compact"` and Tailwind `sm:` breakpoints (as identified in `debt--layout-breakpoint-convention`).

## Requirements

- REQ-1: Centralize Safe Area custom property defaults (`--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right`, `--toast-bottom-offset`) and CSS utility classes (`pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`) in `@actdim/ui-core/src/theme/theme.css`.
- REQ-2: Add virtual keyboard detection (`keyboardVisible: boolean`) to `LayoutService` via `window.visualViewport` and input element focus tracking, synchronizing `data-keyboard="visible"` on `document.documentElement` and emitting updates via `APP.LAYOUT.CHANGED`.
- REQ-3: Update `src/packages/ui-core/docs/topic--adaptive-layout.md` and `topic--frontend-conventions.md` to document the centralized Safe Area utilities, virtual keyboard state, and responsive tier vs Tailwind breakpoint rules.

## Acceptance Criteria

- [x] Safe Area CSS properties and utilities (`pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`) defined in `@actdim/ui-core/src/theme/theme.css`.
- [x] `LayoutInfo` in `layoutTypes.ts` includes `keyboardVisible: boolean`.
- [x] `LayoutService` monitors `visualViewport` height changes and input focus, updating `cachedLayout` and `data-keyboard` attribute.
- [x] `ui-core` documentation updated with virtual keyboard contracts and tier rules.
- [x] Package build and type checks pass cleanly in `@actdim/ui-core`.
