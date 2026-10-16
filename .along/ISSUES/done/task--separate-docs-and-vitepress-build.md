---
protocol: along
protocol_version: "4.4.15"
slug: separate-docs-and-vitepress-build
type: task
status: done
completed: 2026-10-16
priority: medium
created: 2026-10-16
updated: 2026-10-16
agent: antigravity
tags: []
parent: task--separate-docs-and-vitepress-build
blocked_by: []
related: []
---

# Separate docs sources and VitePress build artifacts

## Background Context
In `@actdim/ui-core`, the `docs/` folder houses design system specifications, theme token guidelines, and adaptive layout documentation.
VitePress was not yet set up. To support both human-facing documentation on GitHub Pages and AI agents via progressive disclosure without bloating npm tarballs, VitePress was added with separated build directories.

## Implementation Details
1. Installed `vitepress` and `vitepress-plugin-mermaid` in `devDependencies`.
2. Added `docs:dev`, `docs:build`, and `docs:preview` scripts to `package.json`.
3. Created `docs/.vitepress/config.ts` with `base: '/ui-core/'`, `outDir: '../.dist-docs'`, and `cacheDir: '../node_modules/.cache/vitepress'`.
4. Added `!docs/.vitepress` to `package.json` `files` array to ensure `.vitepress` is excluded from npm releases while preserving `docs/*.md`.
5. Created `.github/workflows/pages.yml` with artifact path set to `.dist-docs`.
6. Added `.dist-docs/` and `.vitepress` cache to `.gitignore`.
7. Verified `pnpm run docs:build` compiles to `.dist-docs/` in 23.14s.
8. Verified `npm pack --dry-run` produces 107.0 kB tarball with 0 VitePress artifacts.

## Acceptance Criteria
- [x] Configure VitePress with `outDir: '../.dist-docs'` and `cacheDir: '../node_modules/.cache/vitepress'`
- [x] Add `docs:*` scripts and `devDependencies` to `package.json`
- [x] Add `!docs/.vitepress` to `package.json` `files`
- [x] Create `.github/workflows/pages.yml` targeting `.dist-docs`
- [x] Add `.dist-docs/` to `.gitignore`
- [x] Verify `docs:build` compiles outside `docs/`
- [x] Verify `npm pack --dry-run` excludes all `.vitepress` build artifacts and configs
- [x] All 50 tests pass cleanly (`pnpm test`)
