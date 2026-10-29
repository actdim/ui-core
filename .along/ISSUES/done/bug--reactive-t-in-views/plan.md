# Living Plan: reactive-t-in-views

## Revision 1 (2026-10-29T11:05:03Z, plan approve --plan-file)

# Plan: reactive t() in views (ui-core bug--reactive-t-in-views)

Execution Mode: Direct (phase 2 of umbrella `bug--locale-switch-no-rerender`; starts after dynstruct
`feat--external-store-reader` is done).

## Steps

1. `src/i18n/i18nRuntime.ts`:
   - `import { fromExternalStore } from '@actdim/dynstruct/componentModel/core';`
   - after `subscribeToRuntime` / `getRuntimeRevision`:
     `const readRuntimeRevision = fromExternalStore(subscribeToRuntime, getRuntimeRevision, 'i18nRuntime');`
     and `export function trackI18n(): void { readRuntimeRevision(); }` with a one-line comment (makes dynstruct
     views and bindings that translate re-run on language change or namespace registration).
   - call `trackI18n()` first thing in `t()` (also covers `translate()`).
2. `src/i18n/formatters.ts`: call `trackI18n()` in the function that resolves the locale (`inst.language`, line ~11).
3. `useT` / `useLocale` (`src/i18n/useT.ts`): unchanged.
4. Audit `src/components/AdaptiveMenu.tsx`, `AdaptiveDialog.tsx`, `ActionSheet.tsx`: `useT('ui-core')` is called in
   the hook-constructor body; make sure its results are used only inside `view`/bindings, not as plain params or prop
   defaults. Fix any captured text with `bind(() => t(...))`.
5. `package.json`: `peerDependencies["@actdim/dynstruct"]` -> `>=1.10.0` (the version from phase 1), then
   `pnpm run version:sync`.
6. Tests (`tests/i18n/`):
   - new `reactiveT.test.tsx`: dynstruct component with `{t('probe:key')}` in `view` and a child with
     `label: bind(() => t('probe:key'))`; after `APP.LOCALE.SET_PREFERENCE` both show the new language, component
     instance is the same (no remount, model state kept);
   - a `formatNumber`/`formatDate` output in `view` follows the locale;
   - existing `useTRender`, `localeService`, `i18nRuntime` tests stay green.
7. Docs: `docs/topic--i18n.md` section 4 - add "In dynstruct components" subsection: `t()` is reactive inside `view`,
   bindings, computed props and effects; a `t()` result passed as a plain param or prop default is frozen at creation,
   use `bind(() => t(...))`. Keep the `useT` text for plain React components.
8. `pnpm run typecheck`, `pnpm run test`, `pnpm run lint`; commit via `/along-commit` bound to `reactive-t-in-views`;
   `along wrap reactive-t-in-views`.
