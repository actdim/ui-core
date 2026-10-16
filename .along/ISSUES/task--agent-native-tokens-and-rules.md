---
protocol: along
protocol_version: "4.4.16"
slug: agent-native-tokens-and-rules
type: task
status: open
priority: high
created: 2026-10-16
updated: 2026-10-16
agent: antigravity
tags: [agent, ai, ui-core, tokens, metadata, llms]
parent: task--agent-native-ecosystem-standardization
blocked_by: []
related: []
---

# Agent-native metadata, design token constraints, and llms.txt for UI-Core

## Purpose and Scope

`@actdim/ui-core` defines the styling contracts, design tokens, layout conventions, and architectural guardrails across all Actdim frontend applications.

Without clear boundaries, AI coding agents frequently introduce design entropy: hardcoding arbitrary hex colors (e.g. `#1976d2`), inventing bespoke inline styles, violating responsive overlay conventions, or importing MobX reactivity into pure React view functions.

`ui-core` serves as the rulebook that constrains agent behavior to ensure consistent, theme-aware, and accessible UI code.

This task establishes agent-native manifests, token guidelines, and `llms.txt` specifications for `@actdim/ui-core`.

---

## 1. Package Manifest (`package.json`)

Update the package manifest with agent-native metadata:

- **`description`**:
  ```text
  "Design tokens, theme system, layout conventions, and architectural guardrails for Dynstruct applications."
  ```

- **`keywords`**:
  Add agent and styling contract keywords:
  ```json
  [
    "agent-native",
    "ai-ready",
    "llm-friendly",
    "design-tokens",
    "theme-contracts",
    "adaptive-layout",
    "styling-rules",
    "dynstruct",
    "react",
    "typescript"
  ]
  ```

- **`ai` and `llms` fields**:
  Verify alignment with ecosystem standard:
  ```json
  "llms": "./llms.txt",
  "ai": {
    "instructions": "./AGENTS.md",
    "docs": "./docs",
    "llms": "./llms.txt",
    "llms-full": "./llms-full.txt"
  }
  ```

- **`files` array**:
  Ensure `llms.txt`, `llms-full.txt`, and `AGENTS.md` are packed for npm distribution.

---

## 2. Standardization of `llms.txt`

Restructure `llms.txt` following the llmstxt.org standard:

### Section A: Overview and Styling Invariants
Define how `ui-core` unifies design tokens, Tailwind utilities, and MUI theming under a coherent semantic contract.

### Section B: Golden Rules for AI Agents
1. **Zero Hardcoded Colors**:
   NEVER write hardcoded hex or rgb color literals (`#fff`, `#1976d2`, `rgb(...)`) in views or styles. Always use semantic design tokens or theme palette variables.
2. **Strict MobX Ban in Views**:
   NEVER import `mobx`, `mobx-react-lite`, or call `makeAutoObservable` inside Dynstruct views. Views must remain pure projections over `c.model`.
3. **Adaptive Overlay Convention**:
   Use `ui-core` adaptive overlay contracts for modals and drawers: overlays automatically switch between bottom-sheet on phone screens and modal dialog on desktop viewports.
4. **Layout Container Standards**:
   Page contents must be wrapped in standard `PageContainer` and `Toolbar` layouts rather than ad-hoc nested flexbox divs.

### Section C: Canonical Usage Snippets
Provide concise, copy-pasteable patterns:
- Using theme tokens in JSX views.
- Applying adaptive layout helpers.

---

## 3. In-Source JSDoc Annotations

Add `@example` and `@agentNotice` annotations to theme and layout exports:
- Document design token accessors.
- Annotate layout wrapper components with responsive breakpoint usage.

---

## Acceptance Criteria

- [ ] `package.json` updated with agent-native description and keywords.
- [ ] `llms.txt` conforms to llmstxt.org with design token rules and layout constraints.
- [ ] Theme and layout utility exports annotated with `@example` JSDoc tags.
- [ ] Vitest test suite passes without errors (`pnpm test`).
