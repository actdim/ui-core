---
protocol: along
protocol_version: "4.5.1"
slug: locale-snapshot-stability
type: bug
status: done
completed: 2026-10-22
priority: high
created: 2026-10-22
updated: 2026-10-22
agent: claude-code
tags: [i18n]
parent: bug--review-p0-fixes
blocked_by: []
related: [feat--i18n-service]
---

# Stable getCurrentLocale snapshot for useSyncExternalStore

## Problem

`useLocale` (and therefore `useT` / `createTypedT` consumers) passes `getCurrentLocale` as the snapshot getter to
`useSyncExternalStore`. `getCurrentLocale` returns `{ ...cachedLocale }`, a new object on every call. React requires
the snapshot to be referentially stable while the store is unchanged; otherwise it logs "getSnapshot should be cached"
and re-renders until "Maximum update depth exceeded".

Related: `translate()` only falls back when the result equals the full key or its last segment. For dot-namespaced
keys (`library.errors.x`) i18next returns `errors.x`, so the raw key is rendered instead of the fallback.

## Requirements

- REQ-1: `getCurrentLocale` returns the same frozen object until the locale actually changes.
- REQ-2: `translate()` also treats the namespace-stripped key as "not found" and uses the fallback.

## Acceptance Criteria
- [x] Consecutive `getCurrentLocale()` calls return the same reference; a locale change yields a new reference
- [x] `translate({ key: 'ns.missing.key', fallback })` returns the fallback for a registered namespace
- [x] Automated tests passing
