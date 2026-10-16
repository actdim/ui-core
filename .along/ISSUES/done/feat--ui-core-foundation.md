---
protocol: along
protocol_version: "4.4.13"
slug: ui-core-foundation
type: feat
status: done
completed: 2026-10-15
priority: high
created: 2026-10-15
updated: 2026-10-15
agent: antigravity
parent: feat--extract-actdim-ui-core
tags: [theme, tokens, dynstruct, layout, overlays]
blocked_by: []
related: []
---

# UI Core shared foundation, themes, overlays and guidelines

## Problem Statement / Background
Monorepo required a shared UI foundation package (@actdim/ui-core) unifying design tokens, Tailwind v4 theme, adaptive layout tiers, and overlay contracts.

## Implementation Details
1. Created @actdim/ui-core package with theme tokens, CSS custom properties, and Tailwind theme plugin.
2. Implemented LayoutService and BackStackService for responsive viewport tiers and modal overlays.
3. Built AdaptiveDialog, ActionSheet, and AdaptiveMenu components.

## Acceptance Criteria
- [x] Core theme token generation and runtime contracts implemented
- [x] LayoutService and responsive tiers (compact, medium, expanded) functional
- [x] Adaptive overlays integrated with BackStackService
- [x] All 50 unit tests passing
