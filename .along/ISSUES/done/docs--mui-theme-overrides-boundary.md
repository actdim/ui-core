---
protocol: along
protocol_version: "4.4.13"
slug: mui-theme-overrides-boundary
type: docs
status: done
completed: 2026-10-15
priority: medium
created: 2026-10-15
updated: 2026-10-15
agent: antigravity
tags: []
blocked_by: []
related: []
---

# Document MUI styleOverrides architectural boundary and invariants

Document the architectural role of MUI styleOverrides as an infrastructure adapter in `@actdim/ui-core` bridging portal containers to semantic design tokens (`themeVar`), and establish the strict negative invariant prohibiting styleOverrides in application and feature code.

## Acceptance Criteria
- [x] Document MUI Theme Integration and styleOverrides architecture in `docs/topic--theme-tokens.md`.
- [x] Add rule 4 on MUI theme overrides boundary in `docs/topic--frontend-conventions.md`.
- [x] Add negative invariant on MUI theme overrides to `AGENTS.md` under Frontend Invariants.
- [x] Pass typography sanitation (`along sanitize`).
- [x] Tests and build passing in `@actdim/ui-core`.

