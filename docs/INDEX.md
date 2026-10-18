---
protocol: along
slug: INDEX
title: '@actdim/ui-core - Knowledge Base Topic Index'
type: index
created: 2026-10-15
updated: 2026-10-18
tags: [index, kb, topics, map]
---

# @actdim/ui-core - Knowledge Base Topic Index

Central entry point and cross-linked topic catalog for project documentation:

## Knowledge Graph & Topic Map

```mermaid
flowchart TD
    INDEX["Knowledge Base (INDEX)"]
    T_ADAPTIVE_LAYOUT["Adaptive Layout and Back-Stack Navigation (LayoutService, BackStackService)"]
    INDEX --> T_ADAPTIVE_LAYOUT
    T_ADAPTIVE_OVERLAYS["Adaptive Overlays (AdaptiveDialog, ActionSheet, AdaptiveMenu)"]
    INDEX --> T_ADAPTIVE_OVERLAYS
    T_DEPENDENCIES["Dependencies & Submodules AI Documentation and Rules"]
    INDEX --> T_DEPENDENCIES
    T_DEVELOPER_GUIDE["@actdim/ui-core Developer & Consumer Integration Guide"]
    INDEX --> T_DEVELOPER_GUIDE
    T_FRONTEND_CONVENTIONS["Frontend Coding Conventions (Dynstruct + MsgMesh)"]
    INDEX --> T_FRONTEND_CONVENTIONS
    T_THEME_TOKENS["Theme Tokens and the tw() Class Helper"]
    INDEX --> T_THEME_TOKENS
    T_FRONTEND_CONVENTIONS -.->|references| T_THEME_TOKENS
    T_FRONTEND_CONVENTIONS -.->|references| T_ADAPTIVE_LAYOUT
    T_FRONTEND_CONVENTIONS -.->|references| T_ADAPTIVE_OVERLAYS
```

---

## Articles

- **[Adaptive Layout and Back-Stack Navigation (LayoutService, BackStackService)](./topic--adaptive-layout.md)** (reference) `layout`, `tiers`, `safe-area`, `backstack`, `navigation`, `dynstruct`, `msgmesh`
- **[Adaptive Overlays (AdaptiveDialog, ActionSheet, AdaptiveMenu)](./topic--adaptive-overlays.md)** (reference) `overlays`, `dialogs`, `drawers`, `menus`, `backstack`, `dynstruct`
- **[Dependencies & Submodules AI Documentation and Rules](./topic--dependencies.md)** (topic) `dependencies`, `ai-context`, `submodules`, `vendor`, `rules`
- **[@actdim/ui-core Developer & Consumer Integration Guide](./topic--developer-guide.md)** (guide) `developer-guide`, `integration`, `adoption`, `migration`, `theming`, `tailwind`, `dynstruct`, `overlays`
- **[Frontend Coding Conventions (Dynstruct + MsgMesh)](./topic--frontend-conventions.md)** (reference) `conventions`, `dynstruct`, `msgmesh`, `theme`, `overlays`, `rules`
- **[Theme Tokens and the tw() Class Helper](./topic--theme-tokens.md)** (reference) `theme`, `design-tokens`, `tailwind`, `styling`, `mui`, `conventions`

---

## Related Context

- [AGENTS.md](../AGENTS.md): Active protocol conventions and rules.
- [Decisions (ADRs)](./decisions/INDEX.md): Architectural Decision Records.
- Active Issues & History: Tracked in `.along/` (see `AGENTS.md`).
