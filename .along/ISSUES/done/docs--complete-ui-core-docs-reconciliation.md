---
protocol: along
protocol_version: "4.4.13"
slug: complete-ui-core-docs-reconciliation
type: docs
status: done
completed: 2026-10-15
priority: high
parent: docs--complete-ui-core-docs-reconciliation
created: 2026-10-15
updated: 2026-10-15
agent: antigravity
tags: [docs, ui-core, reconciliation, kb]
blocked_by: []
related: []
---

# Complete UI Core documentation reconciliation

Add missing topic--adaptive-layout.md covering LayoutService, BackStackService, tiers, safe areas, document ThemeService lifecycle in topic--theme-tokens.md, and update docs/INDEX.md, README.md, llms.txt, llms-full.txt.

## Acceptance Criteria
- [x] Create `docs/topic--adaptive-layout.md` for LayoutService and BackStackService.
- [x] Document ThemeService in `docs/topic--theme-tokens.md`.
- [x] Update `docs/INDEX.md` and `README.md`.
- [x] Rebuild Knowledge Base and LLM context files (`along kb sync`).
- [x] Verify clean typography (`along sanitize --check`).
