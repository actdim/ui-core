---
protocol: along
slug: author-developer-guide
title: Author Developer and Consumer Guide for @actdim/ui-core
type: docs
status: done
completed: 2026-10-16
priority: high
parent: docs--complete-ui-core-integration-guide
tags: [developer-guide, adoption, theming, conventions, ui-core]
created: 2026-10-16
updated: 2026-10-16
agent: antigravity
blocked_by: []
related: []
---

# Docs: Author Developer and Consumer Guide for @actdim/ui-core

## Purpose
`@actdim/ui-core` is a shared foundation package. It requires comprehensive consumer documentation explaining:
1. Installation and Tailwind v4 CSS setup.
2. Component model, clean JSX conventions, and `tw()` usage.
3. Adaptive overlays and layout services.
4. Theme extension policy (how applications define custom CSS variables, `@utility` rules, and plugins without breaking `tw()` type check).
5. Universal project adoption and migration walkthrough for external repositories.
