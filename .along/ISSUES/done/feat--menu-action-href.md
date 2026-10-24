---
protocol: along
protocol_version: "4.5.3"
slug: menu-action-href
type: feat
status: done
completed: 2026-10-24
priority: high
created: 2026-10-24
updated: 2026-10-24
agent: claude-code
tags: [navigation]
milestone: v2.0.0
parent: feat--nav-links-middle-click
blocked_by: []
related: []
---

# href on MenuItemAction (AdaptiveMenu, ActionSheet) and link navigation convention

Child of the mempart issue `feat--nav-links-middle-click`.

## Requirements
- REQ-1: `MenuItemAction` accepts `href`; `AdaptiveMenu` forwards it to the menu item, `ActionSheet` renders an `<a>`
  (plain click through `APP.NAV.GOTO`, modified clicks native).
- REQ-2: The frontend conventions state that controls navigating to a route are links.

## Acceptance Criteria
- [x] Menu actions with `href` render anchors on expanded and compact tiers
- [x] Convention documented (docs/topic--frontend-conventions.md, "Route navigation controls are links")
- [x] Automated tests passing (107 ui-core tests; mempart e2e navLinks.spec.ts)
