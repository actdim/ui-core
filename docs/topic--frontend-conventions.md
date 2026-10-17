---
protocol: along
slug: frontend-conventions
title: Frontend Coding Conventions (Dynstruct + MsgMesh)
type: reference
created: 2026-10-01
updated: 2026-10-16
tags: [conventions, dynstruct, msgmesh, theme, overlays, rules]
---

# Frontend Coding Conventions (Dynstruct + MsgMesh)

Standard architectural and coding conventions for applications and packages built on `@actdim/ui-core`, `@actdim/dynstruct`, and `@actdim/msgmesh`.

---

## 1. Component Model

1. **Every UI element is a Dynstruct component** (`@actdim/dynstruct`): `ComponentStruct` + `ComponentDef` + `useComponent` + `toReact`. See [Dynstruct Documentation](../../dynstruct/docs/INDEX.md).
2. **Public vs. internal struct** (`ComponentStructExt<PublicStruct, InternalState>`):
   - Public `ComponentStruct`: only props passed by parents and the public `msgScope`. No loading flags, caches, or internal indices.
   - Internal state: private reactive `props`, private `actions`, private `effects`.
3. **Self-documenting `msgScope`**: the struct explicitly defines the component bus contract:
   - `provide` - channels the component serves (`msgBroker.provide`).
   - `subscribe` - channels/events it listens to (`msgBroker.subscribe`).
   - `publish` - channels it sends to or requests from (`c.msgBus.send`, `c.msgBus.request`).
4. **Children, not inline JSX**: nested dynstruct components (including `@actdim/dynstruct-mui` wrappers) go into `def.children` via their `useXxx` constructor and render as `<c.children.Name />`.
5. **Bindings**: `bindProp(() => m, 'prop')` for two-way binding; `bind(() => expr)` for read-only values; `bind(get, set)` only for custom getter/setter logic.
6. **Params semantics**: plain params are initial values (applied once by `useComponent`); live input goes only through bindings. Never read `params.x` in a hook-constructor (`def.props` holds defaults only; live values for children come from `m` via `bindProp` / `bind`); bind factory-child props per value (`bind(() => p.item)`), never pass `p` whole.
7. **Clean prop-less JSX and callback policy**: Dynstruct views must remain prop-free in JSX (`<c.children.Name />`). Never pass callback functions or event handlers as JSX attributes. Callback props are strictly prohibited for inter-component coordination across features and pages (e.g. `onSelect*`, `onNavigate*`); cross-component communication and user intents must go through typed MsgMesh channels (`c.msgBus.send`, `msgBroker.subscribe`), and open/close state through two-way bindings (`bindProp`). Low-level event handlers (`onClick`, `onClose`, `onChange`) are permitted exclusively on primitive wrappers (such as `@actdim/dynstruct-mui` controls) when wired inside `def.children` during hook initialization.

---

## 2. State, Lifecycle & Reactivity

1. **Dynstruct-first lifecycle**:
   - State -> `props: { ... }`, mutate via `m.prop = value`.
   - Mount / unmount -> `events: { onReady, onInit, onDestroy, onCatch, onValidate }`. Async loading on mount goes into `events.onReady`.
   - Side effects -> `effects: { ... }` (auto-tracks accessed model props).
   - Callbacks -> `actions: { ... }`.
   - Form inputs -> `c.mapToEdit('fieldPath')`.
2. **Hooks Policy (Dynstruct-First, Not a Ban)**:
   - Built-in React hooks (`useState`, `useEffect`, `useLayoutEffect`, `useReducer`, `useMemo`, `useCallback`, `useRef`) are not needed in typical components. Use reactive model properties, lifecycle events, and actions instead.
   - A built-in hook is acceptable only for non-typical cases the component model does not cover. Because ESLint warns on them (`@typescript-eslint/no-restricted-imports`), mark a justified use with `// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- <reason>`.
   - Custom and third-party hooks (own `useXxx`, external library hooks, React context providers) are permitted inside Dynstruct components as long as app-visible state lives in the model and communication goes through bindings and MsgMesh. See [Dynstruct React Integration](../../dynstruct/docs/topic--04-react-integration.md).
3. **No direct MobX in application code**: no imports from `mobx` / `mobx-react-lite` (`runInAction`, `action`, `observable`, `makeObservable`, `makeAutoObservable`, `observer`, `useLocalObservable`). Dynstruct encapsulates reactivity: mutate model props directly (`m.foo = bar`) or through `actions`.
4. **Reactivity granularity** (`ComponentProp.reactive?: true | false | 'shallow'`):
   - `'shallow'` - for large collections, file trees, read-only arrays: container mutations are tracked, items are not proxied.
   - `false` - for static configuration.

---

## 3. Communication (@actdim/msgmesh)

1. **Bus-first**: inter-component interaction, notifications, and navigation go through `c.msgBus`. No prop drilling across features, no cross-component ref mutation. See [MsgMesh Documentation](../../msgmesh/docs/INDEX.md).
2. **Channel groups**:
   - `in` - request payloads for request/response calls (`c.msgBus.request({ channel, group: 'in' })`).
   - `out` - provider responses and broadcast events (`msgBroker.subscribe`).
   - `ex` - fire-and-forget commands.
3. **Payloads through `c.msgBus`** are normalized (observables -> plain values); class instances (`File`, `Blob`, `Date`) are passed by reference.

---

## 4. TypeScript & Syntax Guidelines

1. **Control flow blocks**: Always use multi-line `{ ... }` blocks for all control flow (`if`, `for`, `while`, `else`). Single-line bodies without braces are strictly prohibited.
2. **Type definition integrity**: Use `type` exclusively. Never use `interface` or `class`.
3. **Design Tokens**: All styling must use semantic tokens via `className={tw('...')}`. Hardcoded hex/rgb/color names are strictly prohibited. See [Theme Tokens Guide](./topic--theme-tokens.md).
4. **MUI Theme Overrides Boundary**: Application and feature code must never declare or customize MUI `styleOverrides`. MUI is used strictly as a behavioral/accessibility foundation wrapped in Dynstruct components. All theme overrides for portal containers (`Dialog`, `Drawer`, `Popover`, `Backdrop`) belong exclusively in `@actdim/ui-core/src/theme/muiTheme.ts` to bridge MUI internals to semantic design tokens (`themeVar`).
5. **Responsive Tier Variants vs Breakpoints**: Visibility, toolbar composition, and structural layout branching must use `compact:`, `medium:`, `expanded:` or `m.tier`. Raw Tailwind `sm:` visibility toggles (`sm:hidden`, `sm:flex`) are strictly prohibited because `sm:` (640px) triggers on landscape phones while `m.tier` remains `compact`. Safe area padding (`pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`) and keyboard awareness (`data-keyboard="visible"`) are provided out-of-the-box by `@actdim/ui-core/theme.css` and `LayoutService`. See [Adaptive Layout Guide](./topic--adaptive-layout.md).

---

## Related Context

- [Knowledge Base Index](./INDEX.md)
- [Theme Tokens and tw() Class Helper](./topic--theme-tokens.md)
- [Adaptive Overlays Guide](./topic--adaptive-overlays.md)
- [Adaptive Layout and Back-Stack Navigation](./topic--adaptive-layout.md)
- [Dynstruct Knowledge Base](../../dynstruct/docs/INDEX.md)
- [MsgMesh Knowledge Base](../../msgmesh/docs/INDEX.md)
