---
protocol: along
protocol_version: "4.5.1"
slug: i18n-rerender-on-resources
type: bug
status: done
completed: 2026-10-23
priority: high
created: 2026-10-23
updated: 2026-10-23
agent: claude-code
tags: [i18n]
parent: bug--webapp-locale-loader
blocked_by: []
related: [bug--locale-snapshot-stability, feat--i18n-service]
---

# useT does not re-render when namespaces load or locale changes

## Problem

After `bug--locale-snapshot-stability` made the `useLocale` snapshot stable, the webapp renders raw keys everywhere
(`nav.explorer`, `auth.signInTitle`, document title `routes.documentTitle`). The previous infinite re-render loop had
hidden two defects:

1. `useT` subscribes with the locale snapshot, which does not change when namespaces are registered. Namespaces are
   loaded with `registerResources` -> `addResourceBundle`, which does not fire the i18next `loaded` event, so subscribers
   are not even notified. Components that rendered before the namespace arrived keep showing raw keys.
2. `setLocalePreference` / init call `changeLanguage` (which notifies subscribers via `languageChanged`) before
   `cachedLocale` is reassigned, so `useLocale` reads the old locale and does not update.

## Requirements

- REQ-1: The runtime keeps a revision number that increments on every change (language change, loaded, resources
  registered); `useT` uses it as its `useSyncExternalStore` snapshot.
- REQ-2: `registerResources` notifies subscribers.
- REQ-3: `LocaleService` notifies subscribers after `cachedLocale` is reassigned.

## Acceptance Criteria
- [x] Registering a namespace bumps the runtime revision and notifies subscribers
- [x] A locale change notifies subscribers after `getCurrentLocale()` already returns the new locale
- [x] Webapp sign-in page shows translated strings and document title (no raw keys) in the browser
- [x] Automated tests passing
