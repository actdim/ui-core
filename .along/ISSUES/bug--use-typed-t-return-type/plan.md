# Living Plan: use-typed-t-return-type

## Revision 1 (2026-11-04T22:58:04Z, plan approve --plan-file)

# Execution plan: bug--use-typed-t-return-type (roadmap step 3)
Issue: `bug--use-typed-t-return-type` in the ui-core submodule (`src/packages/ui-core/.along/ISSUES/`), new; REQ-4 of
Mempart `bug--webapp-strict-typecheck-hang`. Spec = issue file; this plan = order and exact actions; where they
differ this plan wins.

Execution Mode: Direct (one submodule, `src/i18n/useT.ts` + one test + docs).

## Preconditions
- `git -C src/packages/ui-core status --short` shows nothing outside `.along/`; `log origin/main..HEAD` empty.
- No other session has uncommitted ui-core changes (plan 2 phase B edits `tsconfig.base.json` in the same repo; the
  two must not commit at the same time; `git pull --ff-only origin main` before committing).
- The issue exists (step 0 creates it from the text below) and its plan is approved.

## Overrides of the issue text
- Mempart `bug--webapp-strict-typecheck-hang`, Problem Statement: "`dist/i18n/useT.d.ts` inlines a ~4 KB expansion"
  -> "the `createTypedT` declaration in `dist/i18n/useT.d.ts` inlines the expanded key type (file 2165 bytes on
  2026-11-03)". REQ-4: append "Done in ui-core `bug--use-typed-t-return-type` (roadmap step 3)."
- Scope addition, decided (roadmap D8, 2026-11-04): `TranslationKey` also yields the base key of i18next plural
  keys (`items_one`, `items_other` -> `items`). This is part of the plan, not optional. The webapp calls plural keys
  by their base (`ShareDialog.tsx` lines 368, 538, 619; `FolderContentView.tsx` lines 2417, 3767, 3769; 14 plural
  bases in `src/apps/webapp/src/locales/en/*.json`); plan 4 relies on it and adds no casts at the plural calls. This
  only adds accepted keys; no key accepted today is removed.
- Where (D8): done first for Mempart, in ui-core while ui-core is still the submodule `src/packages/ui-core`
  (ui-core issue below, Mempart epic `task--app-core-extraction` as the umbrella for the pointer bump, C2). It
  reaches app-core with the ui-core move in plan 12b (subtree import keeps this commit); nothing is done in
  `src/app-core` here.

### Issue text: ui-core `bug--use-typed-t-return-type` (create verbatim)
```markdown
---
protocol: along
protocol_version: "4.6.0"
slug: use-typed-t-return-type
type: bug
status: open
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: claude-code
tags: [i18n, typescript, performance]
parent: task--app-core-extraction
blocked_by: []
related: [bug--webapp-strict-typecheck-hang]
---

# Explicit return types for `createTypedT` / `useTypedT`; plural base keys in `TranslationKey`

## Problem Statement
`createTypedT<TResources>()` in `src/i18n/useT.ts` returns `useTypedT` without a declared return type, so
`dist/i18n/useT.d.ts` inlines the fully expanded recursive `TranslationKey` type in the `createTypedT` declaration, and
consumers that need the type of `t` (props, helpers) cannot name it. Apps annotate the hook as `TFunction`
instead, which drops key checking and, under `strictFunctionTypes`, makes `tsc` compare `string` against the full key
union (Mempart webapp typecheck does not finish). Plural keys (`items_one`, `items_other`) are called by their base
(`t('items', { count })`), which `TranslationKey` does not contain.

## Requirements
- REQ-1: Exported types `TypedT<TResources, TNamespace>` (the key-typed `t`) and `UseTypedT<TResources>` (the hook);
  `createTypedT` returns `UseTypedT<TResources>`, `useTypedT` returns `TypedT<TResources, TNamespace>`.
- REQ-2: Same accepted keys as before for non-plural keys (type test written before the change stays green).
- REQ-3: `TranslationKey` adds the base of keys ending in `_zero`, `_one`, `_two`, `_few`, `_many`, `_other`.
- REQ-4: `dist/i18n/useT.d.ts` names the types instead of inlining the expansion (smaller file).
- REQ-5: Docs (`docs/topic--i18n.md` section 4) show `TypedT` for helpers and plural base keys.

## Acceptance Criteria
- [ ] Type tests green (`tsc -b tsconfig.json`), runtime tests green (`pnpm --filter @actdim/ui-core test`).
- [ ] `dist/i18n/useT.d.ts` contains `UseTypedT<TResources>` in the `createTypedT` declaration; size recorded before/after.
- [ ] Lint and build green.
```

## Files touched
| Path (relative to `src/packages/ui-core/`) | Change |
|------|--------|
| `src/i18n/useT.ts` | `PluralSuffix`, `PluralBase`, `TypedT`, `UseTypedT` types; `TranslationKey` leaf branch; return types (lines 29-48) |
| `tests/i18n/typedT.test.ts` | new type test |
| `docs/topic--i18n.md` | section "4. React Integration (useT and createTypedT)" (line 103 ff.) |
| `.along/ISSUES/bug--use-typed-t-return-type.md` | new issue |
| Mempart `.along/ISSUES/bug--webapp-strict-typecheck-hang.md` | overrides |
| Mempart root: `src/packages/ui-core` gitlink | pointer bump |
`src/i18n/index.ts` needs no change (`export * from './useT'`, line 5).

## Steps
0. Goal: issue, binding, baseline.
   Actions: `cd src/packages/ui-core`; `along issue create bug use-typed-t-return-type --title "Explicit return types for createTypedT / useTypedT; plural base keys in TranslationKey" --priority high`,
   replace the file with the verbatim text above, `along issue sync`; `along start use-typed-t-return-type`. Apply
   the Mempart overrides. Baseline (from `src/`, into `$SCRATCH` = session scratchpad):
   `pnpm --filter @actdim/ui-core build > $SCRATCH/03-base-build.txt 2>&1`,
   `wc -c src/packages/ui-core/dist/i18n/useT.d.ts > $SCRATCH/03-base-dts-size.txt` (2165 on 2026-11-03),
   `cp src/packages/ui-core/dist/i18n/useT.d.ts $SCRATCH/03-base-useT.d.ts`,
   `pnpm --filter @actdim/ui-core test > $SCRATCH/03-base-test.txt 2>&1`,
   `pnpm --filter @actdim/ui-core lint > $SCRATCH/03-base-lint.txt 2>&1`,
   `pnpm --filter ./apps/webapp typecheck > $SCRATCH/03-base-webapp-typecheck.txt 2>&1`.
   Note: ui-core's `typecheck` script (`tsc -p tsconfig.json --noEmit`) checks nothing, because `tsconfig.json` is a
   solution file with `"files": []`; the type check of this plan is
   `pnpm --filter @actdim/ui-core exec tsc -b tsconfig.json --noEmit` (also the first half of `build`).
   Do not fix the script here; report it in the hand-off.
   Verify: results in `$SCRATCH/03-baseline.md`.

1. Goal: pin today's inference before changing code (REQ-2).
   Actions: create `tests/i18n/typedT.test.ts`:
   ```ts
   import { describe, it, expect, expectTypeOf } from 'vitest';
   import { createTypedT, type TranslationKey } from '@/i18n/useT';

   type Res = {
       a: { x: string; y: { z: string } };
       b: { w: string; items_one: string; items_other: string; deep_name_few: string };
   };

   const useResT = createTypedT<Res>();
   type TA = ReturnType<typeof useResT<'a'>>;

   describe('createTypedT types', () => {
       it('accepts the nested keys of a namespace', () => {
           expectTypeOf<Parameters<TA>[0]>().toEqualTypeOf<'x' | 'y' | 'y.z'>();
           expectTypeOf<TranslationKey<Res['a']>>().toEqualTypeOf<'x' | 'y' | 'y.z'>();
       });

       it('rejects unknown keys', () => {
           const check = (t: TA): string => {
               // @ts-expect-error unknown key
               t('nope');
               return t('y.z');
           };
           expect(typeof check).toBe('function');
       });
   });
   ```
   Verify: `pnpm --filter @actdim/ui-core exec tsc -b tsconfig.json --noEmit` and `pnpm --filter @actdim/ui-core test`
   green on the unchanged `useT.ts` (this is the "before" proof of REQ-2).

2. Goal: named types and plural bases (REQ-1, REQ-3).
   Actions: in `src/i18n/useT.ts` replace lines 29-48 (from `export type TranslationKey` to the end) with:
   ```ts
   /** i18next plural suffixes (`Intl.PluralRules` categories). */
   export type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

   /** `items_one` -> `items`; `never` for keys without a plural suffix. */
   export type PluralBase<K extends string, S extends PluralSuffix = PluralSuffix> = S extends PluralSuffix
       ? K extends `${infer B}_${S}`
           ? B
           : never
       : never;

   export type TranslationKey<T, Depth extends readonly number[] = []> = Depth['length'] extends 6
       ? string
       : T extends Record<string, any>
         ? {
               [K in keyof T & string]: T[K] extends Record<string, any>
                   ? `${K}` | `${K}.${TranslationKey<T[K], [...Depth, 1]>}`
                   : `${K}` | PluralBase<K>;
           }[keyof T & string]
         : string;

   /** Key-typed translate function of one namespace. Name it in props and helpers instead of `TFunction`. */
   export type TypedT<TResources, TNamespace extends keyof TResources & string> = (
       key: TranslationKey<TResources[TNamespace]>,
       params?: Record<string, unknown>,
   ) => string;

   /** Hook returned by `createTypedT`. */
   export type UseTypedT<TResources> = <TNamespace extends keyof TResources & string>(
       ns: TNamespace,
   ) => TypedT<TResources, TNamespace>;

   export function createTypedT<TResources>(): UseTypedT<TResources> {
       return function useTypedT<TNamespace extends keyof TResources & string>(
           ns: TNamespace,
       ): TypedT<TResources, TNamespace> {
           const tFn = useT(ns);

           return (key, params) => {
               return tFn(key as string, params);
           };
       };
   }
   ```
   Keep the inner function name `useTypedT` (rules-of-hooks naming). If `key as string` is rejected, use
   `String(key)` - no `any`.
   Verify: `pnpm --filter @actdim/ui-core exec tsc -b tsconfig.json --noEmit` green; step 1 tests still green.

3. Goal: type tests for the new types (REQ-1, REQ-3).
   Actions: in `tests/i18n/typedT.test.ts` extend the import with `type TypedT, type UseTypedT, type PluralBase` and add:
   - `it('names the hook and t types')`: `expectTypeOf(useResT).toEqualTypeOf<UseTypedT<Res>>();`
     `expectTypeOf<TA>().toEqualTypeOf<TypedT<Res, 'a'>>();`
   - `it('adds plural base keys')`: `expectTypeOf<Parameters<TypedT<Res, 'b'>>[0]>().toEqualTypeOf<'w' | 'items' | 'items_one' | 'items_other' | 'deep_name' | 'deep_name_few'>();`
     `expectTypeOf<PluralBase<'plain'>>().toEqualTypeOf<never>();`
     `expectTypeOf<PluralBase<'a_b_one'>>().toEqualTypeOf<'a_b'>();`
   Verify: `tsc -b tsconfig.json --noEmit` and `pnpm --filter @actdim/ui-core test` green (5 test cases in
   `typedT.test.ts`). If the `PluralBase<'a_b_one'>` assertion fails, do not redesign the type: stop and ask
   (the only multi-underscore keys today are upper-case error codes such as `CANNOT_DELETE_ROOT` in
   `errors.json`, which never end in a lower-case plural suffix; the case only documents behavior).

4. Goal: declaration output (REQ-4).
   Actions: `pnpm --filter @actdim/ui-core build`; `wc -c src/packages/ui-core/dist/i18n/useT.d.ts`;
   `diff $SCRATCH/03-base-useT.d.ts src/packages/ui-core/dist/i18n/useT.d.ts`.
   Verify: the `createTypedT` line reads `export declare function createTypedT<TResources>(): UseTypedT<TResources>;`
   and contains no `infer`; size smaller than the baseline (expected roughly 1.5-2.0 KB: the types are declared once,
   the inlined expansion is gone). Record both sizes.

5. Goal: consumers unchanged (REQ-2).
   Actions: `pnpm --filter ./apps/webapp typecheck`.
   Verify: same result as `$SCRATCH/03-base-webapp-typecheck.txt` (the webapp still annotates `useAppT` as `TFunction`
   until plan 4; a generic function returning `TypedT` is assignable to it without strictFunctionTypes).

6. Goal: docs (REQ-5).
   Actions: `docs/topic--i18n.md` section 4, after the `createTypedT` example (line 125 ff.): add that the hook must not
   be annotated (`export const useAppT = createTypedT<AppResources>();`), a `ts` example of a helper parameter
   `t: TypedT<AppResources, 'pages'>`, and one line: plural keys are called by their base (`t('items', { count })`), and
   `TranslationKey` accepts the base when `_one`/`_other`/... variants exist.
   Verify: `pnpm --filter @actdim/ui-core docs:build` succeeds; `along lint` in `src/packages/ui-core` clean.

7. Goal: commits, close.
   Actions: C1, C2; Hand-off; completion checklist; in `src/packages/ui-core`:
   `along wrap use-typed-t-return-type --summary "TypedT / UseTypedT named return types; plural base keys; d.ts no longer inlines the key expansion" --no-decisions`.

## Commit points
| Id | After step | Repo | Message summary | Bound issue |
|----|------------|------|-----------------|-------------|
| C1 | 6 | ui-core | `fix: named return types for createTypedT/useTypedT, plural base keys (refs #use-typed-t-return-type)`; body: useT.d.ts size before -> after; `git pull --ff-only origin main`, `git push origin main` | ui-core `bug--use-typed-t-return-type` |
| C2 | C1 pushed | Mempart root | `chore: ui-core pointer, typed t return types (refs #app-core-extraction)`; stage `src/packages/ui-core` and the edited `.along/ISSUES/bug--webapp-strict-typecheck-hang.md`; push | `task--app-core-extraction` (epic, in-progress). Do not wrap the epic. |
If plan 2 phase C (root C3) is ready at the same time, its pointer bump may carry this ui-core commit; then C2 is
skipped and the hand-off says so.

## Final verification
- ui-core: `tsc -b tsconfig.json --noEmit`, `test` (baseline count + 5), `lint`, `build` green.
- `dist/i18n/useT.d.ts`: size before/after recorded; `grep -c "infer" src/packages/ui-core/dist/i18n/useT.d.ts`
  -> only the `PluralBase` declaration contains `infer`; `grep "createTypedT" ...` shows `UseTypedT<TResources>`.
- Webapp typecheck: equal to baseline.

## Hand-off
- Mempart `bug--webapp-strict-typecheck-hang` (plan 4) relies on: `TypedT`, `UseTypedT` exported from
  `@actdim/ui-core/i18n`; plural bases accepted (D8; plan 4 adds no casts at the 6 plural calls); ui-core `dist`
  rebuilt (plan 4 rebuilds anyway).
- Plan 12b carries this change into `src/app-core/packages/ui-core` with the ui-core history (D8); no separate
  app-core work.
- Report to the coordinator: ui-core `typecheck` script checks nothing (solution tsconfig); candidate for plan 8 Phase 2b
  (ui-core configs), not fixed here.
- Epic stage 0 row for ui-core: "(done, unpublished; publish in 3R)".

## Stop and ask the user if
- Step 1 tests fail on the unchanged code (today's inference differs from what this plan assumes).
- `PluralBase<'a_b_one'>` does not give `'a_b'`.
- The webapp typecheck result differs from the baseline in step 5.
