---
protocol: along
protocol_version: "4.5.1"
date: 2026-10-23
slug: i18n-rerender-on-resources
agent: claude-code
branch: main
commit: 7cd0143
summary: useT re-renders on runtime revision (namespace registration, locale change); render tests in happy-dom
issues_advanced: []
issues_completed: [bug--i18n-rerender-on-resources]
decisions: []
files: [.along/ISSUES/bug--webapp-locale-loader.md, src/packages/ui-core/.along/.session/i18n-rerender-on-resources/plan.md, src/packages/ui-core/.along/ISSUES/bug--i18n-rerender-on-resources.md, src/packages/ui-core/package.json, src/packages/ui-core/src/i18n/LocaleService.tsx, src/packages/ui-core/src/i18n/i18nRuntime.ts, src/packages/ui-core/src/i18n/useT.ts, src/packages/ui-core/tests/i18n/i18nRuntime.test.ts, src/packages/ui-core/tests/i18n/localeService.test.ts, src/packages/ui-core/tests/i18n/useTRender.test.tsx]
---

# Session: I18n rerender on resources

## Summary
useT re-renders on runtime revision (namespace registration, locale change); render tests in happy-dom

## Decisions
- None (confirmed at wrap: no architectural decisions).

## Blackboard Record

Execution mode: direct; plan revision 1; approved: true.

### Execution Trace

#### Execution Trace: i18n-rerender-on-resources
- 2026-10-22T22:01:32Z phase: planning -> execution
- 2026-10-22T22:01:32Z plan approved (ExitPlanMode) approved_via: exit-plan-mode
- 2026-10-22T22:01:48Z edit src/packages/ui-core/src/i18n/i18nRuntime.ts (x3)
- 2026-10-22T22:01:49Z edit src/packages/ui-core/src/i18n/useT.ts (x2)
- 2026-10-22T22:01:57Z edit src/packages/ui-core/src/i18n/LocaleService.tsx (x3)
- 2026-10-22T22:02:48Z edit src/packages/ui-core/package.json
- 2026-10-22T22:03:13Z edit src/packages/ui-core/tests/i18n/useTRender.test.tsx
- 2026-10-22T22:03:47Z edit src/packages/ui-core/tests/i18n/localeService.test.ts (x2)
- 2026-10-22T22:03:55Z edit src/packages/ui-core/tests/i18n/i18nRuntime.test.ts (x2)
- 2026-10-22T22:04:08Z test pass (along test)
- 2026-10-22T22:07:53Z denied [subproject_boundary] write_to_file: Subproject Boundary Violation [gate: subproject-boundary]: Cannot write root '.along/ISSUES/bug--webapp-locale-loader.md' while this session works on an issu...
- 2026-10-22T22:07:55Z edit src/packages/ui-core/.along/ISSUES/bug--i18n-rerender-on-resources.md
- 2026-10-22T22:08:20Z edit .along/ISSUES/bug--webapp-locale-loader.md
- 2026-10-22T22:35:04Z edit src/packages/ui-core/.along/.session/i18n-rerender-on-resources/plan.md
