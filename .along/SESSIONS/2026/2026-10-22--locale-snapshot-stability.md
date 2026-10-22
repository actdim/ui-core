---
protocol: along
protocol_version: "4.5.1"
date: 2026-10-22
slug: locale-snapshot-stability
agent: claude-code
branch: main
commit: ecdcf79
summary: Stable getCurrentLocale snapshot (no useSyncExternalStore render loop) and translate() fallback for dot-namespaced keys
issues_advanced: []
issues_completed: [bug--locale-snapshot-stability]
decisions: []
files: [src/packages/ui-core/.along/.session/locale-snapshot-stability/plan.md, src/packages/ui-core/.along/ISSUES/bug--locale-snapshot-stability.md, src/packages/ui-core/src/i18n/LocaleService.tsx, src/packages/ui-core/src/i18n/i18nRuntime.ts, src/packages/ui-core/tests/i18n/i18nRuntime.test.ts, src/packages/ui-core/tests/i18n/localeService.test.ts]
---

# Session: Locale snapshot stability

## Summary
Stable getCurrentLocale snapshot (no useSyncExternalStore render loop) and translate() fallback for dot-namespaced keys

## Decisions
- None (confirmed at wrap: no architectural decisions).

## Blackboard Record

Execution mode: direct; plan revision 1; approved: true.

### Execution Trace

#### Execution Trace: locale-snapshot-stability
- 2026-10-22T18:28:16Z edit src/packages/ui-core/src/i18n/LocaleService.tsx (x5)
- 2026-10-22T18:28:30Z edit src/packages/ui-core/src/i18n/i18nRuntime.ts
- 2026-10-22T18:28:44Z edit src/packages/ui-core/tests/i18n/localeService.test.ts
- 2026-10-22T18:28:45Z edit src/packages/ui-core/tests/i18n/i18nRuntime.test.ts
- 2026-10-22T18:29:00Z test pass (along test)
- 2026-10-22T18:29:07Z test pass (along test)
- 2026-10-22T18:29:24Z edit src/packages/ui-core/.along/ISSUES/bug--locale-snapshot-stability.md
- 2026-10-22T18:30:06Z denied [require_active_issue] replace_file_content: Mandatory Issue Anchoring Violation [gate: require-active-issue]: this session is bound to 'locale-snapshot-stability' in 'src/packages/ui-core/.along/', and... (x6)
- 2026-10-22T19:28:41Z edit src/packages/ui-core/.along/.session/locale-snapshot-stability/plan.md
