---
protocol: along
protocol_version: "4.5.4"
slug: reactive-t-in-views
type: bug
status: in-progress
priority: high
created: 2026-10-28
updated: 2026-10-29
agent: claude-code
tags: [i18n]
parent: bug--locale-switch-no-rerender
blocked_by: []
related: []
plan_status: approved
---

# t() and formatters are not reactive in dynstruct views and bindings

## Problem

`useT` / `useLocale` re-render plain React components through `useSyncExternalStore`, but dynstruct components call
the plain `t()` from `src/i18n/i18nRuntime.ts` inside `view` and `bind(() => t(...))`. `t()` reads i18next state that
is not observable, so those views keep the old language after `APP.LOCALE.SET_PREFERENCE` until a page reload. The
formatters (`src/i18n/formatters.ts`, locale from `inst.language`) have the same defect.

Depends on `fromExternalStore` from `@actdim/dynstruct/componentModel/core` (dynstruct `feat--external-store-reader`).

## Requirements

- REQ-1: `t()` (and therefore `translate()`) MUST register a dependency on the i18n runtime revision via
  `fromExternalStore(subscribeToRuntime, getRuntimeRevision)`, so any observer view or binding that calls it re-runs
  on language change and on namespace registration.
- REQ-2: The formatters' locale lookup MUST register the same dependency.
- REQ-3: `useT` / `useLocale` keep working for plain React components (no behavior change).
- REQ-4: ui-core components (`AdaptiveMenu`, `AdaptiveDialog`, `ActionSheet`) MUST translate inside `view` or bindings,
  not into values captured once at creation.
- REQ-5: `docs/topic--i18n.md` MUST state the rule: in dynstruct components call `t()` in `view`, bindings or computed
  props; a `t()` result passed as a plain param or stored as a prop default is frozen at creation.

## Acceptance Criteria
- [x] `t()` and formatters track the runtime revision
- [x] Test: a dynstruct component with `{t(...)}` in `view` and a child with `label: bind(() => t(...))` shows the new language after `APP.LOCALE.SET_PREFERENCE`, without remount
- [x] Test: a formatter output in `view` follows the locale
- [x] ui-core components audited (REQ-4)
- [x] `docs/topic--i18n.md` section 4 updated
- [x] peer dependency on `@actdim/dynstruct` raised to the new version
- [x] Automated tests passing
