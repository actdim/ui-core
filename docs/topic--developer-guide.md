---
protocol: along
slug: developer-guide
title: "@actdim/ui-core Developer & Consumer Integration Guide"
type: guide
created: 2026-10-16
updated: 2026-10-16
tags: [developer-guide, integration, adoption, migration, theming, tailwind, dynstruct, overlays]
---

# @actdim/ui-core Developer & Consumer Integration Guide

`@actdim/ui-core` is the platform foundation package providing semantic design tokens, Tailwind v4 styling integration, Dynstruct component conventions, adaptive overlays, and layout services for Actdim applications.

This guide explains how any application consumes `@actdim/ui-core`, how to configure Tailwind v4, how to use `tw()` and components, how to safely extend the theme, and how to migrate an existing repository to `@actdim/ui-core`.

---

## 1. Prerequisites & Package Installation

### Package Installation
Install `@actdim/ui-core` via your package manager:

```bash
pnpm add @actdim/ui-core
# or
npm install @actdim/ui-core
```

For monorepos using pnpm workspaces, use the workspace protocol:
```json
{
  "dependencies": {
    "@actdim/ui-core": "workspace:*"
  }
}
```

### Peer Dependencies
`@actdim/ui-core` relies on the following peer dependencies:
- `@actdim/dynstruct` (`>=1.9.0`): Component model and reactivity.
- `@actdim/msgmesh` (`>=1.9.0`): Typed event bus and messaging.
- `@mui/material` (`>=9.0.1`), `@emotion/react`, `@emotion/styled`: Headless accessibility and portal primitives.
- `react` (`>=19.2.0`), `react-dom` (`>=19.2.0`): React 19 runtime.
- `tailwindcss` (`>=4.0.0`): Tailwind CSS v4 styling engine.

---

## 2. CSS & Tailwind v4 Integration

### CSS Entrypoint Setup
In your application CSS entrypoint (for example, `src/global.css`), import Tailwind v4 and the `@actdim/ui-core` token stylesheet:

```css
@import 'tailwindcss';
@import '@actdim/ui-core/theme.css';
```

### How Tokens Work in Tailwind v4
1. **Emitted on `:root`**: All tokens are declared in `@theme static` blocks inside `theme.css`. Tailwind emits all variables directly on `:root`.
2. **16 Semantic Scales**: Surface (backgrounds), Foreground (text/icons), Line (borders), Intent (primary/danger/success), Spacing, Object size, Container width, Text style, Emphasis, Font family, Line thickness, Corners, Elevation, Layer (zIndex), Motion, and State opacity.
3. **Automatic Dark Mode**: Mode colors switch automatically under `.dark` selectors. Never use `dark:` class prefixes in application JSX; use semantic tokens like `text-fg-muted` or `bg-surface-panel`.
4. **Responsive Tier Overrides**: Surface paddings and densities adapt automatically under `[data-tier="compact"]`.

---

## 3. Component Conventions & tw() Usage

### Dynstruct Component Model
All application UI elements must follow the Dynstruct component model:
1. **Struct + Def + Hook**: Every component defines a `ComponentStruct`, `ComponentDef`, and hook-constructor (`useXxx`).
2. **Prop-less JSX**: Child components are declared inside `def.children` and rendered as `<c.children.Name />`.
3. **Bus-First Communication**: Inter-component navigation and coordination must use MsgMesh channels (`c.msgBus.send`, `msgBroker.subscribe`). Never pass callback props (`onSelect`, `onNavigate`) across feature boundaries in JSX.
4. **Hooks Policy**: Standard state belongs in model `props: { ... }`. Built-in React hooks (`useState`, `useEffect`) are prohibited in typical components; any non-typical usage requires an explicit `// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- <reason>`.

### The tw() Class Helper
Application markup styles elements exclusively with semantic token classes through `tw()`:

```tsx
import { tw } from '@/theme/tw';

<div className={tw('flex items-center gap-snug p-normal bg-surface-panel rounded-panel')} />
```

- **Compile-Time Checking**: TypeScript validates every token class in string literals against `TwClasses`. Raw numeric classes (`p-4`, `text-slate-500`, `rounded-lg`) produce compile errors.
- **Runtime Merging**: Merges classes safely via `clsx` and token-aware `tailwind-merge`.
- **Content-Only Exception**: `mergeClasses(...)` is reserved strictly for non-UI content palettes (e.g. syntax highlighting, reader themes).

---

## 4. Adaptive Overlays & Layout Services

### Adaptive Overlays
Use canonical primitives from `@actdim/ui-core/components`:
- `AdaptiveDialog`: Adapts from a centered dialog on expanded desktop to a full-screen or bottom sheet on compact mobile.
- `ActionSheet`: Slide-up mobile sheet with backdrop scrim.
- `AdaptiveMenu`: Context/dropdown menu positioned relative to target or anchored bottom.

**Two-Way Binding Invariant**: Overlays bind open state via `bindProp(() => m, 'isDialogOpen')`. Callback props (`onOpen`, `onClose`) in JSX are forbidden.

### Layout & Back-Stack Navigation
- **Layout Tiers**: Managed by `LayoutService` (`@actdim/ui-core/layout`). Automatically applies `data-tier="compact" | "medium" | "expanded"` to the `<html>` root.
- **Safe Areas**: Safe area insets are synced to CSS custom properties (`--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right`).
- **Hardware Back Button**: Managed by `BackStackService` (`@actdim/ui-core/layout`). The topmost open overlay is dismissed first on Android/browser back navigation.

---

## 5. Theme Extension Policy

### Centralization Invariant
All core UI tokens (palettes, spacing scales, standard radii, z-indices) are centralized in `@actdim/ui-core`. An application must NEVER monkey-patch or redefine standard UI tokens in its own stylesheets.

### Permitted Application Extensions
Applications frequently require domain-specific styles, layout geometries, or icon libraries. These are legal and must be declared as follows:

1. **Third-Party Tailwind Plugins in Application CSS**:
   Applications may register supplementary plugins in their root CSS (e.g. `src/global.css`):
   ```css
   @plugin '@tailwindcss/typography';
   @plugin 'tailwindcss-animate';
   @plugin '@iconify/tailwind4' {
       prefixes: mdi, tabler, material-symbols, ph, devicon, logos;
   }
   ```

2. **Application Layout Utilities (@utility)**:
   Layout utilities specific to the application shell belong in the application CSS:
   ```css
   @utility h-app {
       height: calc(100dvh - var(--spacing-header));
   }
   @utility wco-header {
       padding-top: max(env(safe-area-inset-top, 0px), var(--safe-top, 0px));
       padding-left: max(1rem, env(titlebar-area-x, 0px), env(safe-area-inset-left, 0px));
   }
   @utility pt-safe {
       padding-top: max(env(safe-area-inset-top, 0px), var(--safe-top, 0px));
   }
   ```

3. **Application-Specific CSS Variables**:
   Variables for application layout offsets are declared on `:root` or container attributes in application CSS:
   ```css
   :root {
       --toast-bottom-offset: 0px;
   }
   [data-tier="compact"], [data-tier="compact"] * {
       --toast-bottom-offset: calc(var(--spacing-bottom-nav) + env(safe-area-inset-bottom, 0px));
   }
   ```

4. **Domain Content Palettes**:
   For domain-specific colors that are not part of the UI chrome (e.g. ebook sepia reader page background, syntax highlighting), declare them as dedicated CSS custom properties or domain constants, and merge them with `mergeClasses(...)`.

---

## 6. Project Migration & Adoption Walkthrough

When migrating an existing project to `@actdim/ui-core`, follow this standard procedure:

### Step 1: Install Package & Register Dependency
Install `@actdim/ui-core` and execute Along dependency registration:
```bash
pnpm add @actdim/ui-core
along dep-scan --link
```
Verify that `docs/topic--dependencies.md` links to `node_modules/@actdim/ui-core/llms.txt`.

### Step 2: Set Up 1-Liner Code Bridges
To avoid rewriting hundreds of imports across an existing application, create lean re-export bridges:

- `src/theme/tw.ts`:
  ```typescript
  export * from '@actdim/ui-core/theme';
  ```
- `src/config/muiTheme.ts`:
  ```typescript
  export {
      muiBreakpoints,
      createMuiAppTheme,
      defaultMuiTheme,
  } from '@actdim/ui-core/theme';
  ```
- `src/components/core/AdaptiveDialog.tsx`:
  ```typescript
  export {
      type AdaptiveDialogProps,
      type AdaptiveDialogStruct,
      useAdaptiveDialog,
      AdaptiveDialog,
  } from '@actdim/ui-core/components';
  ```
- `src/components/core/ActionSheet.tsx`:
  ```typescript
  export {
      type ActionSheetProps,
      type ActionSheetStruct,
      useActionSheet,
      ActionSheet,
  } from '@actdim/ui-core/components';
  ```
- `src/components/core/AdaptiveMenu.tsx`:
  ```typescript
  export {
      type AdaptiveMenuProps,
      type AdaptiveMenuStruct,
      useAdaptiveMenu,
      AdaptiveMenu,
  } from '@actdim/ui-core/components';
  ```
- `src/services/LayoutService.tsx`:
  ```typescript
  export {
      getCurrentLayout,
      resolveCurrentLayout,
      applyLayoutAttributesToHtml,
      applySafeAreaToCssVariables,
      initLayoutService,
      useLayoutService,
      LayoutService,
      type LayoutServiceStruct,
  } from '@actdim/ui-core/layout';
  ```
- `src/services/BackStackService.tsx`:
  ```typescript
  export {
      backStack,
      useBackStack,
      type BackStackItem,
      type BackStackServiceStruct,
      type BackStackHandler,
      type BackStackOptions,
  } from '@actdim/ui-core/layout';
  ```

### Step 3: Clean-Room Documentation Purge
Remove duplicate copies of UI guidelines to prevent slug collisions in Along:
```bash
git rm docs/topic--frontend-conventions.md
git rm docs/topic--theme-tokens.md
```
Never leave 10-line stubs. The slugs `frontend-conventions` and `theme-tokens` belong exclusively to `@actdim/ui-core`.

### Step 4: Streamline AGENTS.md
In the application's `AGENTS.md`, remove all verbose lists of tokens, MobX bans, and overlay mechanics. Replace them with the canonical 2-line pointer:

```markdown
- **UI & Frontend Invariants**: All UI guidelines, component models, design tokens, adaptive layout tiers, and overlay rules are governed exclusively by `@actdim/ui-core` (`node_modules/@actdim/ui-core/docs/INDEX.md`). Application-specific architecture is defined in `docs/topic--architecture.md`.
```

### Step 5: Document the Application Delta
In `docs/topic--architecture.md`, add a concise section documenting ONLY the application's configuration delta:
- Core tokens from `@actdim/ui-core` via `tw()`.
- Application-specific plugins (e.g. Iconify, Typography).
- Application-specific layout utilities and CSS variables.
- Link to `@actdim/ui-core/docs/topic--developer-guide.md`.

---

## 7. Quality Gates & Verification

Before completing adoption, execute these verification commands:

1. **Negative Assertions**:
   - Verify `Test-Path docs/topic--frontend-conventions.md` is `False`.
   - Verify `Test-Path docs/topic--theme-tokens.md` is `False`.
   - Verify `AGENTS.md` contains 0 redundant token scales or MobX mentions.
2. **Typography Gate**:
   - Run `along sanitize --check`: 0 banned Unicode characters.
3. **Compilation & Tests**:
   - Run `npm run build` / `pnpm build`: 0 TypeScript or bundling errors.
   - Run `along test`: 100% test pass rate.
4. **Knowledge Base Compilation**:
   - Run `along kb-sync`: 0 broken relative Markdown links.

