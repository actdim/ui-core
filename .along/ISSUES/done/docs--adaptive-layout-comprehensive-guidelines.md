---
protocol: along
protocol_version: "4.4.16"
slug: adaptive-layout-comprehensive-guidelines
type: docs
status: done
completed: 2026-10-17
priority: medium
created: 2026-10-17
updated: 2026-10-17
agent: antigravity
tags: [layout, responsive, conventions, docs, tiers]
parent: debt--webapp-dynstruct-conventions-compliance
blocked_by: []
related: []
---

# Comprehensive Responsive Layout Guidelines and Gotchas in UI-Core

## Purpose and Scope
Expand adaptive layout documentation with complete guidelines and gotchas:
1. Dual responsive architecture (`@media` vs `[data-tier]`).
2. Landscape phone aspect ratio pitfalls.
3. Virtual keyboard awareness.
4. Safe area insets.
5. Touch targets and sticky hover prevention.
6. Unified decision matrix.

## Requirements
- REQ-1: Document viewport vs tier nuances and why `sm:` is forbidden for layout shape.
- REQ-2: Document landscape mobile aspect ratio rules and virtual keyboard behaviors.
- REQ-3: Add comprehensive decision matrix to `topic--adaptive-layout.md`.

## Acceptance Criteria
- [x] `topic--adaptive-layout.md` updated with comprehensive guidelines.
- [x] `topic--frontend-conventions.md` updated.
- [x] No ASCII violations.
