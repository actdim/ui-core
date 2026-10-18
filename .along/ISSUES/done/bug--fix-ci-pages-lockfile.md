---
protocol: along
protocol_version: "4.4.16"
slug: fix-ci-pages-lockfile
type: bug
status: done
completed: 2026-10-18
priority: high
created: 2026-10-18
updated: 2026-10-18
agent: antigravity
parent: task--standardize-package-lockfiles-and-npmrc
tags: [ci, github-pages, pnpm, lockfile, npmrc]
blocked_by: []
related: []
---

# Fix GitHub Pages CI lockfile error and standardize standalone pnpm environment

## Problem
In `actdim/ui-core`, GitHub Pages docs CI failed during `actions/setup-node@v4` with `cache: pnpm` because no `pnpm-lock.yaml` existed in the repository. Additionally, missing `.npmrc` with `auto-install-peers=false` causes peer dependency resolution failures for `@actdim/*` in standalone and CI environments.

## Requirements
- Add `.npmrc` with `auto-install-peers=false`.
- Generate standalone `pnpm-lock.yaml` via `pnpm install --ignore-workspace --lockfile-only --config.auto-install-peers=false`.
- Update `.github/workflows/pages.yml` to pass `--config.auto-install-peers=false` to `pnpm install`.
- Verify `pnpm run docs:build` succeeds.

## Acceptance Criteria
- [x] `.npmrc` exists with `auto-install-peers=false`
- [x] `pnpm-lock.yaml` exists in `ui-core` root
- [x] `.github/workflows/pages.yml` updated with `--config.auto-install-peers=false`
- [x] `pnpm run docs:build` passes cleanly
- [x] `pnpm test` passes cleanly
