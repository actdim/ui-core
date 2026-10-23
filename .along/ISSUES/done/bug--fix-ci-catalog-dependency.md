---
protocol: along
protocol_version: "4.5.3"
slug: fix-ci-catalog-dependency
type: bug
status: done
completed: 2026-10-24
priority: high
created: 2026-10-24
updated: 2026-10-24
agent: antigravity
tags: [ci, pnpm, dependencies]
blocked_by: []
related: []
plan_status: approved
---

# Replace catalog: dependency for i18next with semver range

## Problem
In `actdim/ui-core`, GitHub Pages docs CI failed during `pnpm install --no-frozen-lockfile --config.auto-install-peers=false` with:
`ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC No catalog entry 'i18next' was found for catalog 'default'.`
`ui-core` is a standalone package repository and has no local `pnpm-workspace.yaml` catalog definition. Commit `119621c` accidentally added `"i18next": "catalog:"` to `package.json` devDependencies.

## Requirements
- REQ-1: Replace `"i18next": "catalog:"` in `devDependencies` of `package.json` with concrete semver range `"^24.2.3"`.
- REQ-2: Regenerate standalone `pnpm-lock.yaml` via `pnpm install --ignore-workspace --lockfile-only --config.auto-install-peers=false`.
- REQ-3: Verify standalone documentation build `pnpm run docs:build` and test runner `pnpm test` pass cleanly.

## Acceptance Criteria
- [x] `package.json` devDependencies specifies `"i18next": "^24.2.3"` instead of catalog protocol.
- [x] Standalone `pnpm install --ignore-workspace --lockfile-only --config.auto-install-peers=false` resolves and completes with code 0.
- [x] `pnpm-lock.yaml` is updated with `i18next` entries.
- [x] `pnpm test` passes with zero failures.
- [x] `pnpm run docs:build` passes with zero failures.
