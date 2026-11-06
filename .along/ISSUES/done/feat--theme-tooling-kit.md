---
protocol: along
protocol_version: "4.6.1"
slug: theme-tooling-kit
type: feat
status: done
completed: 2026-11-06
priority: medium
created: 2026-11-06
updated: 2026-11-06
agent: antigravity
parent: debt--theme-single-source
tags: [theme, tokens, tooling, theme-kit]
blocked_by: []
related: []
---

# Theme tooling export, app layer generator, generic kit, chrome colors

Export theme tooling (`theme-tooling`), provide `generateAppThemeTokens` and `themeTokensPlugin` for app token layers, support generic `createThemeKit`, and extract `themeChromeColors`.

## Requirements
- REQ-1: Export `./theme-tooling` from `@actdim/ui-core` containing `parseTheme`, `renderTheme`, `generate`, and `themeTokensPlugin`.
- REQ-2: Support app token layer generation (`generateAppThemeTokens`) with additive token invariant validation.
- REQ-3: Provide extensible `createThemeKit` allowing apps to extend core tokens with typed `tw` and `themeVar`.
- REQ-4: Extract browser UI chrome colors into `themeChromeColors` (`#ffffff` light, `#0f172a` dark).

## Acceptance Criteria
- [x] Package export `./theme-tooling` configured in `package.json`
- [x] Tooling unit tests pass (`tests/theme/appTheme.test.ts`)
- [x] Generic kit unit tests pass (`tests/theme/themeKit.test.ts`)
- [x] Documentation updated in `docs/topic--theme-tokens.md` and `docs/topic--developer-guide.md`
- [x] All automated tests in `ui-core` passing (18/18 files)
