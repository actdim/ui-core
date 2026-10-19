---
protocol: along
protocol_version: "4.5.0"
slug: fix-docs-mermaid-dependency
type: bug
status: done
completed: 2026-10-19
priority: high
created: 2026-10-19
updated: 2026-10-19
agent: antigravity
tags: [ci, docs, vitepress, mermaid]
blocked_by: []
related: []
---

# Add mermaid devDependency for VitePress build in ui-core

## Problem
In GitHub Actions pages workflow (`pnpm run docs:build`), Vite/Rollup fails to resolve import "mermaid" from `vitepress-plugin-mermaid/dist/mermaid.ts`. Because `.npmrc` sets `auto-install-peers=false`, peer dependency `mermaid` is not installed automatically, and it is missing from `devDependencies`.

## Requirements
- Add `"mermaid": "^11.4.1"` to `devDependencies` in `package.json`.
- Update standalone `pnpm-lock.yaml`.
- Verify `pnpm run docs:build` succeeds.

## Acceptance Criteria
- [x] `"mermaid": "^11.4.1"` declared in `devDependencies`
- [x] Standalone `pnpm-lock.yaml` contains `mermaid`
- [x] `pnpm run docs:build` passes cleanly
- [x] `pnpm test` passes cleanly
