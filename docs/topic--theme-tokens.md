---
protocol: along
slug: theme-tokens
title: Theme Tokens and the tw() Class Helper
type: reference
created: 2026-10-10
updated: 2026-10-15
tags: [theme, design-tokens, tailwind, styling, mui, conventions]
---

# Theme Tokens and the tw() Class Helper

All visual style values in Actdim applications (colors, spacing, sizes, typography, borders, corners,
shadows, layers, motion) are **semantic design tokens** declared once in
`src/theme/theme.css`. Markup never uses raw Tailwind values (`text-slate-500`, `p-4`,
`rounded-lg`); it uses token classes (`text-fg-muted`, `p-normal`, `rounded-control`) through the
typed `tw()` helper, which rejects anything else at compile time.

## Files

| File | Role |
| --- | --- |
| `src/theme/theme.css` | Source of truth: every token with a description, `Based on` / `Replaces` per scale, a TOKEN TABLE, `.dark` and `[data-tier="compact"]` overrides, tier variants, `focus-ring` utility, `:focus-visible` base style. |
| `src/theme/theme.generated.ts` | Generated from theme.css: `themeTokens` (CSS variable, value, per-mode values, sub-properties), `themeUtilities`, `themeVariants`. Committed. Do not edit. |
| `src/theme/tw.ts` | `tw()`, `mergeClasses()`, `TwClasses`, scale types (`ThemeColor`, `ThemeSpacing`, ...), tailwind-merge config. |
| `src/theme/tw.typecheck.ts` | Compile-time tests of the class validation (run by `tsc -b`). |
| `src/theme/themeRuntime.ts` | Typed runtime contract for getting, setting, resetting, and batch applying CSS variables on `:root` or scoped elements (`themeRuntime`, `themeCssVars`). |
| `postcss.ts` | The generator (`pnpm theme:gen`). |
| `src/theme/muiTheme.ts` | MUI theme built from the same tokens (palette, radius, font, zIndex). |

## How tokens become classes

Tokens live in Tailwind 4 `@theme static` blocks, so they are plain `:root` CSS variables. The
variable prefix is a Tailwind namespace and decides which classes exist:

```css
@theme static {
    --spacing-normal: 0.75rem;      /* -> p-normal, gap-normal, mt-normal, ... */
    --color-fg-muted: #64748b;      /* -> text-fg-muted, border-fg-muted, ... */
    --radius-panel: 0.75rem;        /* -> rounded-panel, rounded-t-panel, ... */
}

.dark {
    --color-fg-muted: #94a3b8;      /* same class, other value: no dark: in markup */
}
```

## Scales

| Scale | Elements | Example |
| --- | --- | --- |
| Surface (background) | page, panel, inset, popup, dialog, hover, selected, inverse, scrim | `bg-surface-panel` |
| Foreground (text, icons) | fg-default, fg-muted, fg-faint, fg-disabled, fg-inverse | `text-fg-muted` |
| Line (borders) | line-default, line-muted, line-strong, focus | `border-line-default` |
| Intent | primary, secondary, success, info, warning, danger, neutral; roles base / -strong / -soft / -line / -contrast | `bg-danger-soft text-danger-strong` |
| Spacing | micro, tight, snug, normal, relaxed, loose, spacious, vast | `gap-snug p-normal` |
| Object size | control-xs/sm/md/lg, icon-sm/md/lg, avatar-sm/md/lg, cover-sm/md, touch, header, bottom-nav, sidebar | `h-control-md` |
| Container width | form, dialog-sm/md/lg, popup, content, page (+ built-in prose) | `max-w-dialog-md` |
| Text style | micro, caption, label, body, body-lg, title, headline, display | `text-title` |
| Emphasis | regular, emphasis, strong | `font-emphasis` |
| Font family | ui, prose, code | `font-code` |
| Line thickness | thin, thick, heavy (border, ring, outline, divide) | `border-b-thick` |
| Corners | control, panel, popup, dialog (+ built-in full) | `rounded-panel` |
| Elevation | panel, popup, dialog (+ built-in none) | `shadow-popup` |
| Layer | sticky, header, drawer, dialog, popup, toast, tooltip (MUI zIndex values) | `z-dialog` |
| Motion | duration short/medium/long, ease standard/enter/exit | `duration-short ease-enter` |
| State opacity | disabled, muted | `opacity-disabled` |
| Variants | dark, compact, medium, expanded | `compact:hidden` |

## MUI Theme Integration and styleOverrides Architecture

MUI (`@mui/material`) is used exclusively for headless accessibility, portals, and low-level interactive primitives (dialogs, drawers, popovers, touch targets). It is NOT used as an application styling engine.

### Role of styleOverrides in ui-core

In `src/theme/muiTheme.ts`, `styleOverrides` serve as a one-time infrastructure bridge connecting internal MUI portal elements to semantic design tokens:

- **Portal DOM Containers**: Elements like `.MuiDialog-paper`, `.MuiDrawer-paper`, `.MuiPopover-paper`, and `.MuiBackdrop-root` render outside the standard DOM hierarchy via React portals. Their default Material Design aesthetics are replaced with design tokens via `themeVar(...)`:
  - `MuiBackdrop.root`: `themeVar('color', 'surface-scrim')`
  - `MuiDialog.paper`: `themeVar('color', 'surface-dialog')`, `themeVar('radius', 'dialog')`, `themeVar('shadow', 'dialog')`
  - `MuiDrawer.paper`: `themeVar('color', 'surface-dialog')`
  - `MuiPopover.paper`: `themeVar('color', 'surface-popup')`, `themeVar('radius', 'popup')`, `themeVar('shadow', 'popup')`
- **Touch Target Enforcements**: Mobile/touch accessibility minimums (`44px` on `pointer: coarse`) are enforced globally on `MuiButtonBase` and `MuiIconButton`.

### Strict Boundary and Negative Invariants

1. **No Application-Level styleOverrides**: Applications (`src/apps/*`) and feature modules must NEVER define or customize MUI `styleOverrides`. Applications import `createMuiAppTheme` from `@actdim/ui-core/theme` without mutation.
2. **Tailwind-First Styling**: All application UI styling is written with Dynstruct components and Tailwind v4 semantic token classes via `className={tw('...')}`.
3. **Infrastructure Isolation**: `styleOverrides` are an infrastructure adapter in `@actdim/ui-core`, not a template or standard for feature development. If a new primitive with portal DOM nodes is introduced to `@actdim/ui-core`, its token bindings belong strictly in `src/theme/muiTheme.ts`.

---

## ThemeService Architecture and Lifecycle

`ThemeService` (`src/theme/ThemeService.tsx`) coordinates theme preference, system dark mode queries, DOM attributes, browser chrome meta tags, and MsgMesh events.

### Mode and Preference Types

- `ThemePreference`: `'light' | 'dark' | 'system'` (user preference, persisted in `localStorage`).
- `ThemeMode`: `'light' | 'dark'` (resolved active mode applied to the document).

### Service Contracts

1. **System Resolution**: `resolveThemeMode(preference, systemMode)` resolves `'system'` to the current OS setting (`matchMedia('(prefers-color-scheme: dark)')`).
2. **DOM Synchronization**:
   - `applyThemeToHtml(mode)`: Toggles class `.dark` on `document.documentElement` and sets `data-theme="dark" | "light"`.
   - `applyThemeToMeta(mode)`: Updates `<meta name="theme-color">` to match the background surface token (`#f8fafc` for light, `#020617` for dark).
3. **MsgMesh Integration**:
   - `APP.THEME.CHANGED`: Broadcasts `{ mode, preference, muiTheme }` to subscribed components (used by Dynstruct root to update MUI `ThemeProvider`).
   - `APP.THEME.SET_PREFERENCE`: Inbound command accepting `{ preference }`.

---

## IDE and Editor Integration (Tailwind CSS IntelliSense)

To enable class completions, linting, and hover previews (displaying generated CSS and variable values) for `tw('...')` calls inside VS Code:

### 1. Class Function Recognition
The Tailwind CSS IntelliSense extension (`bradlc.vscode-tailwindcss`) by default inspects only `class` and `className` JSX attributes. To parse class string arguments inside function calls like `tw('...')` or `clsx('...')`, add them to `tailwindCSS.classFunctions` in workspace `.vscode/settings.json`:

```json
{
    "tailwindCSS.classFunctions": ["tw", "clsx", "cva", "cn"]
}
```

### 2. Monorepo Config Resolution in Tailwind v4
In Tailwind v4, configuration is CSS-first (`@import 'tailwindcss';` + `@theme static`). In a monorepo where `@actdim/ui-core` is an extracted library package without a direct Tailwind runtime build, the language server needs to know which CSS stylesheet supplies the theme tokens and utilities:

```json
{
    "tailwindCSS.experimental.configFile": "src/apps/webapp/src/global.css"
}
```

Specifying `tailwindCSS.experimental.configFile` in the root `.vscode/settings.json` points the language server to `src/apps/webapp/src/global.css`, ensuring that hover styles and completions work across both application code and package components (such as `ActionSheet`, `AdaptiveDialog`, `AdaptiveMenu`).



