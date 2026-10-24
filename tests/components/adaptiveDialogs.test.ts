import { describe, it, expect, beforeEach } from 'vitest';
import { type BackHandler } from '../../src/layout/backStackTypes';
import {
    registerBackHandler,
    unregisterBackHandler,
    setUnhandledBackHandler,
    getUnhandledBackHandler,
} from '../../src/layout/BackStackService';
import { type LayoutTier } from '../../src/layout/layoutTypes';
import { type MenuItemAction, type ActionSheetStruct } from '../../src/components/ActionSheet';
import { type AdaptiveDialogProps } from '../../src/components/AdaptiveDialog';
import { type AdaptiveMenuProps } from '../../src/components/AdaptiveMenu';

describe('Adaptive Dialogs, Menus & BackStack Handling', () => {
    describe('Prioritized Back Handler Execution', () => {
        let handlers: BackHandler[] = [];

        const register = (handler: BackHandler) => {
            handlers = [...handlers.filter((h) => h.id !== handler.id), handler];
        };

        const unregister = (id: string) => {
            handlers = handlers.filter((h) => h.id !== id);
        };

        const triggerBack = (): { handled: boolean } => {
            const sorted = [...handlers].sort((a, b) => b.priority - a.priority);
            for (const entry of sorted) {
                try {
                    if (entry.handle()) {
                        return { handled: true };
                    }
                } catch {
                    // ignore
                }
            }
            return { handled: false };
        };

        beforeEach(() => {
            handlers = [];
        });

        it('executes higher priority handler first', () => {
            const executionOrder: string[] = [];

            register({
                id: 'page-back',
                priority: 10,
                handle: () => {
                    executionOrder.push('page');
                    return true;
                },
            });

            register({
                id: 'dialog-back',
                priority: 100,
                handle: () => {
                    executionOrder.push('dialog');
                    return true;
                },
            });

            const result = triggerBack();
            expect(result.handled).toBe(true);
            expect(executionOrder).toEqual(['dialog']);
        });

        it('falls through to lower priority handler if higher priority returns false', () => {
            const executionOrder: string[] = [];

            register({
                id: 'page-back',
                priority: 10,
                handle: () => {
                    executionOrder.push('page');
                    return true;
                },
            });

            register({
                id: 'unhandled-dialog',
                priority: 100,
                handle: () => {
                    executionOrder.push('unhandled-dialog');
                    return false;
                },
            });

            const result = triggerBack();
            expect(result.handled).toBe(true);
            expect(executionOrder).toEqual(['unhandled-dialog', 'page']);
        });

        it('unregisters handlers cleanly by ID', () => {
            const executionOrder: string[] = [];

            register({
                id: 'dialog-back',
                priority: 100,
                handle: () => {
                    executionOrder.push('dialog');
                    return true;
                },
            });

            unregister('dialog-back');

            const result = triggerBack();
            expect(result.handled).toBe(false);
            expect(executionOrder).toHaveLength(0);
        });

        it('returns handled false when no handlers are registered', () => {
            const result = triggerBack();
            expect(result.handled).toBe(false);
        });
    });

    describe('Standalone BackHandler Queue Helper', () => {
        it('queues registrations safely before MsgBus is initialized', () => {
            const handler: BackHandler = {
                id: 'test-pre-init',
                priority: 100,
                handle: () => true,
            };

            // Should not throw even if service has not mounted yet
            expect(() => {
                registerBackHandler(handler);
            }).not.toThrow();

            expect(() => {
                unregisterBackHandler('test-pre-init');
            }).not.toThrow();
        });

        it('registers and unregisters unhandled back handler safely', () => {
            const fallback = () => true;
            setUnhandledBackHandler(fallback);
            expect(getUnhandledBackHandler()).toBe(fallback);

            setUnhandledBackHandler(null);
            expect(getUnhandledBackHandler()).toBeNull();
        });
    });

    describe('Adaptive Dialog Layout Properties by Tier', () => {
        const resolveDialogPresentation = (tier: LayoutTier, userFullScreen?: boolean) => {
            const isFullScreen = userFullScreen !== undefined ? userFullScreen : tier === 'compact';
            return {
                fullScreen: isFullScreen,
                renderStickyHeader: isFullScreen,
                headerStyle: isFullScreen ? 'compact-sticky-header' : 'standard-modal-header',
            };
        };

        it('resolves fullScreen true on compact tier by default', () => {
            const presentation = resolveDialogPresentation('compact');
            expect(presentation.fullScreen).toBe(true);
            expect(presentation.renderStickyHeader).toBe(true);
            expect(presentation.headerStyle).toBe('compact-sticky-header');
        });

        it('resolves fullScreen false on medium tier', () => {
            const presentation = resolveDialogPresentation('medium');
            expect(presentation.fullScreen).toBe(false);
            expect(presentation.renderStickyHeader).toBe(false);
            expect(presentation.headerStyle).toBe('standard-modal-header');
        });

        it('resolves fullScreen false on expanded tier', () => {
            const presentation = resolveDialogPresentation('expanded');
            expect(presentation.fullScreen).toBe(false);
            expect(presentation.renderStickyHeader).toBe(false);
            expect(presentation.headerStyle).toBe('standard-modal-header');
        });

        it('allows explicit user override of fullScreen on expanded tier', () => {
            const presentation = resolveDialogPresentation('expanded', true);
            expect(presentation.fullScreen).toBe(true);
        });
    });

    describe('Adaptive Menu & Action Sheet Actions', () => {
        it('maps menu action items correctly and supports danger flag', () => {
            let clickedAction = '';

            const actions: MenuItemAction[] = [
                {
                    id: 'edit',
                    label: 'Edit Item',
                    onClick: () => {
                        clickedAction = 'edit';
                    },
                },
                {
                    id: 'delete',
                    label: 'Delete Item',
                    danger: true,
                    onClick: () => {
                        clickedAction = 'delete';
                    },
                },
            ];

            expect(actions).toHaveLength(2);
            expect(actions[0].label).toBe('Edit Item');
            expect(actions[0].danger).toBeUndefined();
            expect(actions[1].danger).toBe(true);

            actions[0].onClick?.();
            expect(clickedAction).toBe('edit');

            actions[1].onClick?.();
            expect(clickedAction).toBe('delete');
        });

        it('disables actions when disabled property is true', () => {
            const action: MenuItemAction = {
                id: 'locked',
                label: 'Locked Feature',
                disabled: true,
                onClick: () => {},
            };

            expect(action.disabled).toBe(true);
        });
    });

    describe('Adaptive Toast Positioning Offset Calculation', () => {
        const calculateToastBottom = (tier: LayoutTier, bottomNavHeightPx: number, safeAreaBottomPx: number) => {
            if (tier === 'compact') {
                return bottomNavHeightPx + safeAreaBottomPx + 16;
            }
            return 16;
        };

        it('calculates bottom offset above bottom nav on compact tier', () => {
            const compactBottom = calculateToastBottom('compact', 56, 34);
            // 56px bottom nav + 34px safe area + 16px margin = 106px
            expect(compactBottom).toBe(106);
        });

        it('keeps default 16px bottom offset on medium and expanded tiers', () => {
            expect(calculateToastBottom('medium', 56, 34)).toBe(16);
            expect(calculateToastBottom('expanded', 56, 34)).toBe(16);
        });
    });

    describe('Overlay Dismissal and onClose Lifecycle Contract', () => {
        const createOverlayCloseAction = (model: { open: boolean; onClose?: () => void }) => {
            return () => {
                model.open = false;
                if (model.onClose) {
                    model.onClose();
                }
            };
        };

        it('invokes onClose callback and resets open flag on dismissal', () => {
            let closed = false;
            const model = {
                open: true,
                onClose: () => {
                    closed = true;
                },
            };
            const close = createOverlayCloseAction(model);

            close();

            expect(model.open).toBe(false);
            expect(closed).toBe(true);
        });

        it('safely dismisses overlay when onClose is omitted', () => {
            const model = {
                open: true,
                onClose: undefined,
            };
            const close = createOverlayCloseAction(model);

            expect(() => close()).not.toThrow();
            expect(model.open).toBe(false);
        });

        it('verifies AdaptiveDialogProps, ActionSheetStruct, and AdaptiveMenuProps types support optional onClose', () => {
            const dialogProps: AdaptiveDialogProps = {
                open: true,
                onClose: () => {},
            };
            const menuProps: AdaptiveMenuProps = {
                open: true,
                tier: 'expanded',
                actions: [],
                onClose: () => {},
            };
            const actionSheetProps: ActionSheetStruct['props'] = {
                open: true,
                actions: [],
                onClose: () => {},
            };

            expect(typeof dialogProps.onClose).toBe('function');
            expect(typeof menuProps.onClose).toBe('function');
            expect(typeof actionSheetProps.onClose).toBe('function');
        });
    });
});
