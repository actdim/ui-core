---
protocol: along
protocol_version: "4.5.0"
slug: i18n-service
type: feat
status: done
completed: 2026-10-21
priority: high
created: 2026-10-21
updated: 2026-10-21
agent: claude-code
tags: [i18n]
parent: feat--ui-i18n-foundation
blocked_by: []
related: []
---

# I18n service: LocaleService on MsgMesh, typed t(), formatters, ui-core namespace

## Problem

Child of the mempart umbrella `feat--ui-i18n-foundation`; architecture is fixed by the
mempart ADR `ui-i18n-architecture` (ADR-2026-10-21). This issue builds the reusable
i18n foundation in `@actdim/ui-core`; apps (mempart webapp) only register their own
namespaces and wire the service at startup.

Execution Mode: Direct (single package, mirrors the existing ThemeService pattern).

## Architecture

### 1. Module layout `src/i18n/` (new export `@actdim/ui-core/i18n`)
- `i18nTypes.ts`
  - `LocaleCode` (string, BCP 47), `LocaleInfo = { preference: LocaleCode | 'system'; locale: LocaleCode; dir: 'ltr' | 'rtl' }`.
  - `I18nMsgStruct = MsgStruct<{ 'APP.LOCALE.CHANGED': { in: LocaleInfo }; 'APP.LOCALE.SET_PREFERENCE': { in: { preference: LocaleCode | 'system' } } }>`,
    `UiI18nMsgStruct = BaseAppMsgStruct & I18nMsgStruct`, `I18nMsgChannels<...>` (same shape as `themeTypes.ts`).
  - `MessageDescriptor = { key: string; params?: Record<string, unknown>; fallback?: string }`.
  - `I18nServiceOptions = { storageKey?; supportedLocales: readonly LocaleCode[]; fallbackLocale: LocaleCode; loadNamespace: (locale, ns) => Promise<Record<string, unknown>>; hostLocale?: () => LocaleCode | undefined; onLocaleChanged?: (info) => void }`.
- `i18nRuntime.ts` - engine wrapper (the only file importing `i18next`):
  `createI18nRuntime`, `t(key, params?)`, `translate(descriptor)`, `ensureNamespaces(ns[])`,
  `registerResources(locale, ns, data)` (sync, for bundled ui-core strings and tests).
- `localeResolve.ts` - pure functions: `negotiateLocale(candidates, supported, fallback)`
  (`ru-RU` -> `ru`, unknown -> fallback), `resolveLocale(preference, { stored, host, navigator })`
  following the ADR order (user > stored > host > navigator > fallback; the server-side user setting
  arrives later through `APP.LOCALE.SET_PREFERENCE`).
- `LocaleService.tsx` - mirrors `theme/ThemeService.tsx`:
  `initLocaleService(msgBus, options): Promise<() => void>` (resolve, load boot namespaces, apply `<html lang dir>`,
  send `APP.LOCALE.CHANGED`, listen `APP.LOCALE.SET_PREFERENCE`; resolves with the disposer only after the boot
  namespaces are loaded, so apps can await it before the first render). `SET_PREFERENCE` payload carries an optional
  `source?: 'user' | 'server' | 'host'` that is echoed in `APP.LOCALE.CHANGED` (apps use it to avoid sync loops).
  Language switch order: load missing namespaces for the new locale first, then switch the engine, then notify
  (no flash of keys). Concurrent switches: last one wins.
  `getCurrentLocale()`, `setLocalePreference()`, stored-preference helpers with try/catch storage,
  `useLocaleService` / `LocaleService` Dynstruct component (model `{ preference, locale, dir }`).
- `useT.ts` - React binding: `useLocale()` via `useSyncExternalStore` on the runtime's change
  signal, `useT(ns?)` returns a bound `t` so a Dynstruct `view` re-renders on language change.
  Typed keys: `TranslationKey<NS>` derived from the en resource type via module augmentation
  (`declare module '@actdim/ui-core/i18n' { interface ... }` is not allowed - `type` only - so use
  a generic `createTypedT<Resources>()` factory that apps call with their `typeof en` resources).
- `formatters.ts` - `formatDate`, `formatDateTime`, `formatRelative`, `formatNumber`,
  `formatBytes`, `formatDuration`, `formatList` on `Intl.*`, memoized per locale, bound to the
  current locale.
- Resources at the package level `src/locales/en/ui-core.json`, `src/locales/ru/ui-core.json` (same centralized
  layout as apps) - strings of existing ui-core components (`AdaptiveDialog`, `AdaptiveMenu`, `ActionSheet`:
  cancel/close/back labels, aria-labels). Registered synchronously at `initLocaleService` (bundled, small).
- `index.ts` - public surface.
- `src/i18n/tooling/localeParity.ts` - node-only `checkLocaleParity(localesDir, { sourceLocale: 'en' })` returning
  missing/extra keys per locale and namespace; exported as a separate entry `@actdim/ui-core/i18n-tooling`
  (must not be imported by browser code). Used by the ui-core script and by apps (`i18n:check`).
- `I18nServiceOptions` additionally takes `bootNamespaces: readonly string[]` and `pseudoLocale?: string`
  (e.g. `'en-XA'`, accepted only when `import.meta.env.DEV` is passed in as `enablePseudo: true`).

### 2. Package wiring
- `i18next` and `eslint-plugin-i18next` added to the pnpm catalog in the mempart root `pnpm-workspace.yaml`
  (outside the submodule - commit that line in mempart); `i18next` as ui-core `peerDependency` + `devDependency`
  and in `packageConfig` externals (`vite.config.ts` uses `config.externals`).
- `package.json` `exports["./i18n"]` and `exports["./i18n-tooling"]` (same shape as `./theme`); root `src/index.ts`
  re-exports `./i18n` only; keyword `i18n`; locale JSON shipped in `dist` (verify with `pnpm build` + inspect `dist`).
- After merge in the submodule: bump the submodule pointer in mempart (`pnpm run version:sync` flow, see
  `docs/topic--setup-and-workflow.md` in mempart).

### 3. Migrate ui-core components
- Replace hardcoded labels in `components/ActionSheet.tsx`, `AdaptiveDialog.tsx`,
  `AdaptiveMenu.tsx` with `useT('ui-core')`; props that accept labels keep accepting strings
  and also `MessageDescriptor`.

### 4. Tooling
- `scripts/i18n-check.ts`: compares key sets of every locale against `en` per namespace
  (missing keys -> error for en-derived parity, extra keys -> warning); `pnpm run i18n:check`.
- ESLint `eslint-plugin-i18next` `no-literal-string` (jsx-text-only mode) for `src/components/**`.
- Pseudo-locale `en-XA` generated at runtime from `en` (accented + padded) when enabled in dev.

### 5. Tests (`tests/i18n/`, vitest, hermetic)
- `localeResolve.test.ts`: negotiation (`ru-RU`, `en-GB`, unsupported, empty), resolution order.
- `localeService.test.ts`: init sends `APP.LOCALE.CHANGED`, `SET_PREFERENCE` switches language,
  persists to storage, sets `<html lang>`, disposer stops listening (same style as `themeService.test.ts`).
- `i18nRuntime.test.ts`: interpolation, ru plurals (1/2/5/21), fallback to en for missing key,
  `translate(descriptor)`.
- `formatters.test.ts`: bytes/duration/date in en and ru.
- `i18nCheck.test.ts`: parity script on temp fixture dirs.

### 6. Docs
- New `docs/topic--i18n.md` (reference): API, key naming (`<ns>.<area>.<item>`), namespaces,
  MessageDescriptor rule, formatters, adding a language, server error codes rule.
- Link from `docs/INDEX.md`; add i18n invariants to `topic--frontend-conventions.md`
  ("no user-visible literals in JSX", "no ad-hoc toLocaleString").

Out of scope: webapp wiring and string migration (umbrella), server error codes, RTL
(`feat--ui-rtl-support` in mempart).

## Acceptance Criteria
- [x] `@actdim/ui-core/i18n` exports LocaleService, `useT`, `createTypedT`, `translate`, formatters, types
- [x] Language switch via `APP.LOCALE.SET_PREFERENCE` re-renders consumers without reload and persists
- [x] Locale negotiation handles regional tags and falls back to `en`
- [x] ru plural forms and interpolation verified by tests
- [x] ui-core components have no hardcoded user-visible strings; `ui-core` namespace exists in en and ru
- [x] `i18n:check` parity script and `no-literal-string` lint in place
- [x] `docs/topic--i18n.md` written and linked from `docs/INDEX.md`
- [x] Automated tests passing
