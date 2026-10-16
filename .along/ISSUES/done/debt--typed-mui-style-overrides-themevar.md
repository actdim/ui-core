---
protocol: along
protocol_version: "4.4.13"
slug: typed-mui-style-overrides-themevar
type: debt
status: done
completed: 2026-10-15
priority: medium
parent: debt--typed-mui-style-overrides-themevar
created: 2026-10-15
updated: 2026-10-15
agent: antigravity
tags: [theme, mui, themevar, typing]
blocked_by: []
related: []
---

# Typed MUI styleOverrides using themeVar helper

Switch MUI components.styleOverrides in muiTheme.ts from mode-dependent JS color evaluations to strictly typed themeVar() CSS custom property references.

## Acceptance Criteria
- [x] In `src/theme/muiTheme.ts`, import and use `themeVar` for `MuiBackdrop`, `MuiDialog`, `MuiDrawer`, `MuiPopover`.
- [x] Eliminate mode-dependent color evaluations in `styleOverrides` (preserve mode evaluation in `palette`).
- [x] Use `themeVar('radius', ...)` and `themeVar('shadow', ...)` for paper overrides.
- [x] 100% test pass rate in `@actdim/ui-core`.
- [x] Clean TypeScript build (`tsc -b`).
