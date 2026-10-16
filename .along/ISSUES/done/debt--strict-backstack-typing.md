---
protocol: along
protocol_version: "4.4.13"
slug: strict-backstack-typing
type: debt
status: done
completed: 2026-10-15
priority: high
parent: debt--clean-msgbus-typing-crutches
created: 2026-10-15
updated: 2026-10-15
agent: antigravity
tags: []
blocked_by: []
related: []
---

# Strict typing for BackStackService and generic MsgBus service contracts

Eliminate ad-hoc untyped BusSender type and `c.msgBus as unknown as BusSender` duck-typing workaround in BackStackService.tsx.
Make service functions in ThemeService and LayoutService generic over message structures (`<TMsg extends ThemeMsgStruct>`, `<TMsg extends LayoutMsgStruct>`) to allow consuming applications to pass composite message buses without type assertions.

## Acceptance Criteria
- [ ] Remove `type BusSender` and `as unknown as` cast in `src/layout/BackStackService.tsx`.
- [ ] Implement `BackStackRegistrationBus` with discriminated union for `APP.NAV.BACK_HANDLER_REGISTER` and `APP.NAV.BACK_HANDLER_UNREGISTER`.
- [ ] Make `initThemeService` and `updateThemePreference` generic over `<TMsg extends ThemeMsgStruct>`.
- [ ] Make `initLayoutService` generic over `<TMsg extends LayoutMsgStruct>`.
- [ ] 100% test pass rate in `@actdim/ui-core` test suite.
