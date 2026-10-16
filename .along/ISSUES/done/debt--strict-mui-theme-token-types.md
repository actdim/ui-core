---
protocol: along
protocol_version: "4.4.13"
slug: strict-mui-theme-token-types
type: debt
status: done
completed: 2026-10-15
priority: high
parent: debt--strict-mui-theme-token-types
created: 2026-10-15
updated: 2026-10-15
agent: antigravity
tags: [theme, mui, typing, compile-time]
blocked_by: []
related: []
---

# Strict compile-time ThemeColor typing for MUI theme builder

Replace untyped string arguments and loose Record types in `muiTheme.ts` with strict compile-time `ThemeColor` types derived directly from `themeTokens.color`.

## Acceptance Criteria
- [ ] In `src/theme/muiTheme.ts`, type `name` in `color(name: ThemeColor, mode: ThemeMode)` strictly using `ThemeColor`.
- [ ] Remove `Record<string, TokenLike>` loose type casting on `themeTokens.color`.
- [ ] Verify template literal compatibility for `intent` helper (`${ThemeIntent}-strong`, `${ThemeIntent}-contrast`).
- [ ] Verify 100% test pass rate in `@actdim/ui-core`.
- [ ] Verify clean TypeScript build (`tsc -b`).
