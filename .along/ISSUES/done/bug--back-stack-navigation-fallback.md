---
protocol: along
protocol_version: "4.4.16"
slug: back-stack-navigation-fallback
type: bug
status: done
completed: 2026-10-16
priority: high
created: 2026-10-16
updated: 2026-10-16
agent: antigravity
tags: [ui-core, navigation, back-stack]
parent: bug--topbar-back-button-navigation
blocked_by: []
related: []
---

# Fix back button navigation fallback and explorer root evaluation

## Problem Statement
In `BackStackService.tsx`, `evaluateCanGoBack()` does not exclude `/explorer` from non-root paths, causing the TopBar back button to be displayed even at the root explorer screen. Furthermore, when `unhandledBackCallback` is invoked, `evaluateCanGoBack()` is not re-evaluated.

## Requirements
- Treat `/explorer` as a root path so `canGoBack` is false when no handlers are active.
- When `unhandledBackCallback` succeeds, re-evaluate `canGoBack`.
- Export `getUnhandledBackHandler` helper.

## Acceptance Criteria
- [x] Root paths (`/`, ``, `/explorer`) resolve `canGoBack: false` when no handlers are active.
- [x] Non-root paths resolve `canGoBack: true`.
- [x] Handlers intercept before `unhandledBackCallback`.
- [x] `unhandledBackCallback` execution triggers `evaluateCanGoBack()`.
- [x] Unit tests pass cleanly.
