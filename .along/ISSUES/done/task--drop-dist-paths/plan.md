# Living Plan: drop-dist-paths

## Revision 1 (2026-11-04T22:58:04Z, plan approve --plan-file)

# Execution plan: task--package-exports-and-paths (roadmap step 2)
Issues (three repos, one per subproject, `[gate: subproject-boundary]`):
- `task--package-root-export` in dynstruct-mui (`src/packages/dynstruct-mui/.along/ISSUES/`), new.
- `task--drop-dist-paths` in ui-core (`src/packages/ui-core/.along/ISSUES/`), new.
- `task--package-exports-and-paths` in Mempart (`.along/ISSUES/`), new, umbrella; the other two carry
  `parent: task--package-exports-and-paths`.
This is step 10 of `task--shared-lint-tsconfig`, pulled forward. Spec = issue files; this plan = order and exact
actions; where they differ this plan wins.

Execution Mode: Direct (3 repos, 1-2 files each, config only).

Why a separate ui-core issue and not plan 3's `bug--use-typed-t-return-type`: different subject and different
acceptance (tsconfig resolution vs i18n type); reusing it would tie plan 3's wrap to dynstruct-mui work and mix two
reasons in one ui-core history entry. The two ui-core sessions touch different files
(`tsconfig.base.json` vs `src/i18n/useT.ts`, `tests/i18n/`) but the same submodule repository: run the ui-core part
(phase B) only when no other session has uncommitted ui-core changes, and fast-forward before committing.

## Preconditions
- `git -C src/packages/dynstruct-mui status --short` and `git -C src/packages/ui-core status --short` show nothing
  outside `.along/`; both `log origin/main..HEAD` empty.
- No session currently has uncommitted edits in ui-core (ask the coordinator / check plan 3's state). If plan 3 is
  running in ui-core, do phase A now and phase B after plan 3's ui-core commit is pushed.
- The three issue files exist (created in step 0 from the texts below if missing) and the plan is approved for
  each (`along plan status <slug>` in each repo).

## Overrides of the issue text
- `task--shared-lint-tsconfig` (Mempart), section "Decisions", bullet "Step 10": replace "Complete `exports` in
  `dynstruct-mui` (add `"."`) and `ui-core` (add `"./*"`)" by "Add `"."` to `dynstruct-mui` `exports` (ui-core already
  exports `"."` and `"./*"`, `src/packages/ui-core/package.json` lines 57-87; roadmap K1)" and append "Done in
  `task--package-exports-and-paths` (roadmap step 2)." Implementation step 10 gets the same suffix. AC text
  "`src/apps/webapp/tsconfig.base.json` maps `@actdim/dynstruct-mui` ... (also the webapp vitest alias)" is in
  `task--ci-pipeline` AC line 41: append "(removed by `task--package-exports-and-paths`)".
- Epic `task--app-core-extraction`, stage 0 row "ui-core adds `"./*"`": replace by "dynstruct-mui adds `"."`; webapp and
  ui-core drop `paths` to `dist` (`task--package-exports-and-paths`)".

### Issue text: dynstruct-mui `task--package-root-export` (create verbatim)
```markdown
---
protocol: along
protocol_version: "4.6.0"
slug: package-root-export
type: task
status: open
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: claude-code
tags: [packaging, exports, typescript]
parent: task--package-exports-and-paths
blocked_by: []
related: []
---

# Root `"."` entry in `exports`

## Problem Statement
`package.json` `exports` has only `"./*"`. A bare `import { ... } from '@actdim/dynstruct-mui'` (51 imports in
Mempart webapp and ui-core) does not resolve through `exports` under `moduleResolution: bundler`, so consumers map it
with tsconfig `paths` to `dist/index.d.ts` and a vitest alias to `dist/index.es.js`, although `src/index.ts` and
`dist/index.*` exist.

## Requirements
- REQ-1: `exports` gets `"."` -> `types: ./dist/index.d.ts`, `import: ./dist/index.es.js`, listed before `"./*"`.
- REQ-2: `"./*"` and `typesVersions` stay unchanged (subpath imports such as `@actdim/dynstruct-mui/Toast` keep working).
- REQ-3: No version bump here (monorepo-wide `version:sync` in the release step).

## Implementation steps
1. Add the entry; build; check that bare and subpath imports resolve (Node `import.meta.resolve`, tsc trace).

## Acceptance Criteria
- [ ] `"."` export present; `pnpm --filter @actdim/dynstruct-mui build`, `test`, `lint` green.
- [ ] Bare import resolves to `dist/index.es.js` / `dist/index.d.ts` without `paths` or aliases.
```

### Issue text: ui-core `task--drop-dist-paths` (create verbatim)
```markdown
---
protocol: along
protocol_version: "4.6.0"
slug: drop-dist-paths
type: task
status: open
priority: medium
created: 2026-11-03
updated: 2026-11-03
agent: claude-code
tags: [typescript, tsconfig, packaging]
parent: task--package-exports-and-paths
blocked_by: [task--package-root-export]
related: []
---

# Resolve `@actdim/dynstruct-mui` through `exports`, not tsconfig `paths`

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
```

### Issue text: Mempart `task--package-exports-and-paths` (create verbatim)
```markdown
---
protocol: along
protocol_version: "4.5.4"
slug: package-exports-and-paths
type: task
status: open
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: claude-code
tags: [typescript, tsconfig, packaging, app-core]
parent: task--app-core-extraction
blocked_by: []
related:
  - task--shared-lint-tsconfig
  - task--ci-pipeline
---

# Consume dynstruct-mui and ui-core through `exports` (no `paths` to `dist`)

## Problem Statement
`src/apps/webapp/tsconfig.base.json` maps `@actdim/dynstruct-mui(/*)` and `@actdim/ui-core(/*)` to
`../../packages/*/dist/*.d.ts`, `src/apps/webapp/vitest.node.config.ts` aliases `@actdim/dynstruct-mui` to
`dist/index.es.js`, and ui-core maps dynstruct-mui the same way. Cause: dynstruct-mui exported only `"./*"`.
Step 10 of `task--shared-lint-tsconfig`, pulled forward to stage 0 of the epic.

## Requirements
- REQ-1: dynstruct-mui exports `"."` (child `task--package-root-export`).
- REQ-2: ui-core drops its `paths` to dynstruct-mui `dist` (child `task--drop-dist-paths`).
- REQ-3: The webapp drops the four `paths` entries to `dist` (keeps `"@/*"`) and the vitest alias for
  `@actdim/dynstruct-mui`; the Vite dev alias to `packages/dynstruct-mui/src` stays (dev-time source mapping, revisited
  with the dev-config Vite preset).
- REQ-4: Baseline and before/after: webapp typecheck, test, lint, build; resolution trace shows `dist` files reached
  through `exports`.

## Acceptance Criteria
- [ ] Children done and pushed; pointers bumped in one root commit.
- [ ] No tsconfig `paths` or vitest alias to another package's `dist` in Mempart.
- [ ] Automated tests passing (`pnpm --filter ./apps/webapp typecheck`, `test`, `lint`, `build`).
```

## Files touched
| Path | Change |
|------|--------|
| `src/packages/dynstruct-mui/package.json` | `exports["."]` added before `"./*"` (lines 54-59) |
| `src/packages/ui-core/tsconfig.base.json` | delete `paths` lines 39-40 (dynstruct-mui); keep `"@/*"` |
| `src/apps/webapp/tsconfig.base.json` | delete the 4 `@actdim/*` lines from `paths`; keep `"@/*"` |
| `src/apps/webapp/vitest.node.config.ts` | delete the `'@actdim/dynstruct-mui'` alias line |
| three issue files, `.along/ISSUES/task--shared-lint-tsconfig.md`, `task--ci-pipeline.md`, epic | overrides, status |
| root gitlinks `src/packages/dynstruct-mui`, `src/packages/ui-core` | pointer bump |
Not touched: `src/apps/webapp/vite.config.ts` lines 104-107 (dev alias to dynstruct-mui `src`), ui-core `package.json`,
`typesVersions` in both packages (under `bundler`/`node16` resolution TypeScript uses `exports` when present; the
existing `typesVersions` keep serving `node10` subpath consumers).

## Steps
0. Goal: issues, binding, baseline.
   Actions: create the three issues if missing: `along issue create task <slug> --title "<title>" --priority <p>`
   in each repo root (dynstruct-mui, ui-core, Mempart), then replace each file's content with the verbatim text above;
   `along issue sync` in each repo. Apply the Overrides to `task--shared-lint-tsconfig.md`, `task--ci-pipeline.md`
   and the epic. In the Mempart root: `along start package-exports-and-paths`.
   Baseline from `src/` into `$SCRATCH` (session scratchpad), first making sure dist is current:
   `pnpm --filter @actdim/dynstruct-mui build`, `pnpm --filter @actdim/ui-core build`, then
   `pnpm --filter ./apps/webapp typecheck > $SCRATCH/02-base-typecheck.txt 2>&1`,
   `pnpm --filter ./apps/webapp test > $SCRATCH/02-base-test.txt 2>&1`,
   `pnpm --filter ./apps/webapp lint > $SCRATCH/02-base-lint.txt 2>&1`,
   `pnpm --filter ./apps/webapp build > $SCRATCH/02-base-build.txt 2>&1`,
   `pnpm --filter @actdim/ui-core test > $SCRATCH/02-base-uicore-test.txt 2>&1`,
   `pnpm --filter @actdim/dynstruct-mui test > $SCRATCH/02-base-mui-test.txt 2>&1`, and the resolution trace
   (from `src/apps/webapp`): `node ../../node_modules/typescript/lib/tsc.js -p tsconfig.build.json --noEmit --composite false --incremental false --traceResolution | grep -E "^======== Module name '@actdim/(dynstruct-mui|ui-core)[^']*' was successfully resolved" | sort -u > $SCRATCH/02-base-resolve.txt`.
   Verify: all results and the webapp `dist/assets` total size (`du -sb src/apps/webapp/dist`) noted in
   `$SCRATCH/02-baseline.md`; the trace lists at least these 8 module names: `@actdim/dynstruct-mui`, `@actdim/dynstruct-mui/Toast`,
   `@actdim/dynstruct-mui/Menu`, `@actdim/ui-core/theme`, `/i18n`, `/layout`, `/components`, `/i18n-tooling` (bare
   `@actdim/ui-core` is not imported by the webapp; extra names imported from inside `dist/*.d.ts` are fine).

Phase A - dynstruct-mui
1. Goal: `"."` export (child REQ-1, REQ-2).
   Actions: `cd src/packages/dynstruct-mui`; `along start package-root-export`. In `package.json` change `exports` to:
   ```json
   "exports": {
       ".": {
           "types": "./dist/index.d.ts",
           "import": "./dist/index.es.js"
       },
       "./*": {
           "types": "./dist/*.d.ts",
           "import": "./dist/*.es.js"
       }
   },
   ```
   4-space indent as the file uses. Nothing else in the file changes.
   Verify: from `src/`: `pnpm --filter @actdim/dynstruct-mui build`, `test`, `lint` green; `ls src/packages/dynstruct-mui/dist/index.d.ts src/packages/dynstruct-mui/dist/index.es.js` both exist; from `src/apps/webapp`:
   `node --input-type=module -e "console.log(import.meta.resolve('@actdim/dynstruct-mui'), import.meta.resolve('@actdim/dynstruct-mui/Toast'))"`
   prints `file:///.../packages/dynstruct-mui/dist/index.es.js` and `.../dist/Toast.es.js`.
2. Goal: commit A (C1), wrap the child.
   Actions: C1; `along wrap package-root-export --summary "exports gains the root entry" --no-decisions` in
   `src/packages/dynstruct-mui`.

Phase B - ui-core (only when the precondition on ui-core holds)
3. Goal: drop ui-core `paths` to dynstruct-mui (child REQ-1, REQ-2).
   Actions: `cd src/packages/ui-core`; `git pull --ff-only origin main`; `along start drop-dist-paths`. In
   `tsconfig.base.json` the `paths` object becomes exactly `"paths": { "@/*": ["./src/*"] }` (delete lines 39-40 and the
   trailing comma of line 38).
   Verify: from `src/`: `pnpm --filter @actdim/ui-core build` (runs `tsc -b tsconfig.json --noEmit` + vite build),
   `test`, `lint` green and equal to baseline; `grep -rn "dynstruct-mui/dist" src/packages/ui-core --include=*.json` -> no hit.
4. Goal: commit B (C2), wrap the child.
   Actions: C2; `along wrap drop-dist-paths --summary "dynstruct-mui types through exports, no paths to dist" --no-decisions`.

Phase C - Mempart webapp
5. Goal: webapp without `paths` and vitest alias (REQ-3).
   Actions: in `src/apps/webapp/tsconfig.base.json` the `paths` object becomes `"paths": { "@/*": ["./src/*"] }` (delete
   the 4 `@actdim/*` lines). In `src/apps/webapp/vitest.node.config.ts` delete the line
   `'@actdim/dynstruct-mui': resolve('../../packages/dynstruct-mui/dist/index.es.js'),` (the `alias` object keeps `'@'`).
   Verify: `pnpm --filter ./apps/webapp typecheck` green; rerun the trace command of step 0 into
   `$SCRATCH/02-after-resolve.txt`: the same module names as the baseline, every one resolved to a file under
   `packages/dynstruct-mui/dist/` or `packages/ui-core/dist/` (same files as the baseline; the baseline paths came from
   `paths`, the new ones from `exports` via `node_modules/@actdim/*` symlinks, so the printed path may differ only by the
   symlink prefix). Also `grep -rn "dist/index\|dist/\*" src/apps/webapp/tsconfig*.json src/apps/webapp/vitest.node.config.ts` -> no hit.
6. Goal: full webapp check (REQ-4).
   Actions: from `src/`: `pnpm --filter ./apps/webapp test`, `lint`, `build`.
   Verify: equal to baseline (same test count, same lint result, build succeeds, `du -sb` of `dist` within 1 percent of
   baseline; the bundle is unchanged because Vite build resolution did not change).
7. Goal: root commit (C3) and close.
   Actions: C3; Hand-off edits; completion checklist; in the root:
   `along wrap package-exports-and-paths --summary "dynstruct-mui exports '.', webapp and ui-core drop paths to dist" --no-decisions`.

## Commit points
| Id | After step | Repo | Message summary | Bound issue |
|----|------------|------|-----------------|-------------|
| C1 | 1 | dynstruct-mui | `fix: exports gains the root entry (refs #package-root-export)`; `git push origin main` | dynstruct-mui `task--package-root-export` |
| C2 | 3 | ui-core | `chore: dynstruct-mui types through exports, no paths to dist (refs #drop-dist-paths)`; `git pull --ff-only` then `git push origin main` | ui-core `task--drop-dist-paths` |
| C3 | 6 | Mempart root | `chore: webapp drops paths and vitest alias to package dist; dynstruct-mui and ui-core pointers (refs #package-exports-and-paths)`; stages the two config files, the two gitlinks and the `.along/` issue edits; `git push origin main` | `task--package-exports-and-paths` |

## Final verification
- `$SCRATCH/02-base-*.txt` vs reruns: webapp typecheck, test (same count), lint, build; ui-core and dynstruct-mui
  test and build - all equal.
- `grep -rnE "\"@actdim/[a-z-]+(/\*)?\": \[" src/apps/*/tsconfig*.json src/packages/*/tsconfig*.json` -> no hit
  (no package `paths` left in Mempart-owned or touched configs; investigate any hit in other packages and report it,
  do not change it).
- `git -C src/packages/dynstruct-mui log origin/main..HEAD`, same for ui-core -> empty; root `git status --short`
  clean for the touched paths.

## Hand-off
- `task--shared-lint-tsconfig`: step 10 marked done (override text); plan 8 must not add `paths` again and uses
  `exports` resolution in the dev-config tsconfig presets.
- `task--ci-pipeline` (plan 7): the webapp vitest alias is gone; CI still builds packages before app typecheck/test.
- 3R: dynstruct-mui and ui-core `main` pushed; ui-core's standalone typecheck needs dynstruct-mui with `"."` from npm,
  which 3R publishes (version:sync rewrites ui-core's `@actdim/dynstruct-mui` range to `>=1.14.0`).
- Epic table row updated per Overrides.

## Stop and ask the user if
- The trace after step 5 resolves any `@actdim/*` import to a `.ts` source file or to `node_modules/.pnpm` instead of
  the workspace `dist` (would mean the workspace link is broken).
- Webapp typecheck has new errors after step 5 (it means some types differed between `paths` and `exports`).
- Plan 3 (or any other session) has uncommitted ui-core changes when phase B should start and the coordinator cannot
  say when they land.
- `git pull --ff-only` in ui-core fails (diverged history).
