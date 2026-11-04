---
protocol: along
protocol_version: "4.6.0"
slug: drop-dist-paths
type: task
status: open
priority: medium
created: 2026-11-03
updated: 2026-11-04
agent: claude-code
tags: [typescript, tsconfig, packaging]
parent: task--package-exports-and-paths
blocked_by: []
related: []
plan_status: approved
---

# Resolve `@actdim/dynstruct-mui` through `exports`, not tsconfig `paths`

Blocked by dynstruct-mui issue `task--package-root-export` (the `"."` export), which lives in
the dynstruct-mui repository's own `.along/`, so it cannot be a `blocked_by` key here.

## Problem Statement
`tsconfig.base.json` maps `@actdim/dynstruct-mui` and `@actdim/dynstruct-mui/*` to `../dynstruct-mui/dist/*.d.ts`
because dynstruct-mui had no `"."` export. The path reaches outside this repository and breaks standalone clones.

## Requirements
- REQ-1: Remove both `@actdim/dynstruct-mui` entries from `compilerOptions.paths`; keep `"@/*"`.
- REQ-2: `tsc -b`, `test`, `lint`, `build` stay green; types of `@actdim/dynstruct-mui` come from its `exports`.
- REQ-3: A standalone clone needs `@actdim/dynstruct-mui` with the `"."` export from npm (published by the
  monorepo release step); until then only the Mempart workspace build is verified.

## Acceptance Criteria
- [ ] No `paths` entry points to another package's `dist`.
- [ ] Automated checks passing (`pnpm --filter @actdim/ui-core build`, `test`, `lint`).
