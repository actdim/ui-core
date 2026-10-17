---
protocol: along
protocol_version: "4.4.16"
date: 2026-10-17
slug: mobile-adaptivity-foundation
agent: antigravity
branch: main
commit: '3067532'
summary: Centralize safe area CSS utilities and virtual keyboard handling in ui-core
issues_advanced: []
issues_completed: [task--mobile-adaptivity-foundation]
decisions: []
risks_logged: []
spikes_conducted: []
---

# Session: Mobile adaptivity foundation

## Summary
Centralize safe area CSS utilities and virtual keyboard handling in ui-core

## Decisions
- None (confirmed at wrap: no architectural decisions).

## Blackboard Record

Execution mode: direct; plan revision 1; approved: true.

### Attributed Files

| Path | Kind | Edits | Last edit | Sessions |
| --- | --- | --- | --- | --- |
| `src/packages/ui-core/docs/topic--adaptive-layout.md` | docs | 1 | 2026-10-17T17:01:26Z | antigravity--8ca3b90f-ba83-49a1-9e09-13d85596ee89 |
| `src/packages/ui-core/docs/topic--frontend-conventions.md` | docs | 1 | 2026-10-17T17:01:39Z | antigravity--8ca3b90f-ba83-49a1-9e09-13d85596ee89 |
| `src/packages/ui-core/src/layout/LayoutService.tsx` | source | 1 | 2026-10-17T16:59:17Z | antigravity--8ca3b90f-ba83-49a1-9e09-13d85596ee89 |
| `src/packages/ui-core/src/layout/layoutTypes.ts` | source | 2 | 2026-10-17T17:00:46Z | antigravity--8ca3b90f-ba83-49a1-9e09-13d85596ee89 |
| `src/packages/ui-core/src/theme/theme.css` | source | 3 | 2026-10-17T16:58:22Z | antigravity--8ca3b90f-ba83-49a1-9e09-13d85596ee89 |
| `src/packages/ui-core/tests/layout/layoutService.test.ts` | source | 3 | 2026-10-17T17:00:52Z | antigravity--8ca3b90f-ba83-49a1-9e09-13d85596ee89 |

### Plan

#### Living Plan: mobile-adaptivity-foundation

Title: Expose safe area CSS utilities and keyboard avoidance in ui-core

##### Steps
- [x] Step 1: Centralize Safe Area custom property defaults and @utility pt-safe, pb-safe, pl-safe, pr-safe in theme.css
- [x] Step 2: Add keyboardVisible to LayoutInfo and track virtual keyboard state in LayoutService
- [x] Step 3: Add unit tests for virtual keyboard detection and data-keyboard attribute
- [x] Step 4: Update documentation in topic--adaptive-layout.md and topic--frontend-conventions.md
- [x] Step 5: Verify build, tests, and token generator

### Execution Trace

#### Execution Trace: mobile-adaptivity-foundation
- 2026-10-17T16:55:11Z plan approved (along start --approved; approved_via: cli-unverified)
- 2026-10-17T16:58:22Z edit src/packages/ui-core/src/theme/theme.css (x3)
- 2026-10-17T16:58:29Z edit src/packages/ui-core/src/layout/layoutTypes.ts
- 2026-10-17T16:59:17Z edit src/packages/ui-core/src/layout/LayoutService.tsx
- 2026-10-17T17:00:08Z edit src/packages/ui-core/tests/layout/layoutService.test.ts (x2)
- 2026-10-17T17:00:46Z edit src/packages/ui-core/src/layout/layoutTypes.ts
- 2026-10-17T17:00:52Z edit src/packages/ui-core/tests/layout/layoutService.test.ts
- 2026-10-17T17:01:26Z edit src/packages/ui-core/docs/topic--adaptive-layout.md
- 2026-10-17T17:01:39Z edit src/packages/ui-core/docs/topic--frontend-conventions.md
- 2026-10-17T17:02:24Z denied [require_active_issue] replace_file_content: Mandatory Issue Anchoring Violation [gate: require-active-issue]: this session is bound to 'mobile-adaptivity-foundation' in 'src/packages/ui-core/.along/', ...
