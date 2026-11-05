---
protocol: along
protocol_version: "4.6.0"
slug: use-typed-t-return-type
type: bug
status: done
completed: 2026-11-05
priority: high
created: 2026-11-03
updated: 2026-11-05
agent: claude-code
tags: [i18n, typescript, performance]
parent: task--app-core-extraction
blocked_by: []
related: [bug--webapp-strict-typecheck-hang]
plan_status: approved
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
- [x] Type tests green (`tsc -b tsconfig.json`), runtime tests green (`pnpm --filter @actdim/ui-core test`).
- [x] `dist/i18n/useT.d.ts` contains `UseTypedT<TResources>` in the `createTypedT` declaration; size recorded before/after.
- [x] Lint and build green.
