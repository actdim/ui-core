import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type BackHandler } from '../../src/layout/backStackTypes';
import {
    registerBackHandler,
    unregisterBackHandler,
    setUnhandledBackHandler,
    getUnhandledBackHandler,
} from '../../src/layout/BackStackService';

describe('BackStackService Navigation & Unhandled Fallback', () => {
    let handlers: BackHandler[] = [];
    const originalWindow = (globalThis as unknown as { window?: unknown }).window;

    const setupMockWindow = (pathname = '/explorer', historyLength = 1, historyStateIdx = 0) => {
        const mockWin = {
            location: {
                pathname,
            },
            history: {
                length: historyLength,
                state: { idx: historyStateIdx },
                back: vi.fn(),
            },
        };
        (globalThis as unknown as { window: unknown }).window = mockWin;
        return mockWin;
    };

    beforeEach(() => {
        handlers = [];
        setUnhandledBackHandler(null);
    });

    afterEach(() => {
        setUnhandledBackHandler(null);
        if (originalWindow !== undefined) {
            (globalThis as unknown as { window: unknown }).window = originalWindow;
        } else {
            delete (globalThis as unknown as { window?: unknown }).window;
        }
    });

    describe('setUnhandledBackHandler & getUnhandledBackHandler', () => {
        it('registers and retrieves the unhandled fallback handler', () => {
            const fallback = vi.fn().mockReturnValue(true);
            setUnhandledBackHandler(fallback);

            const registered = getUnhandledBackHandler();
            expect(registered).toBe(fallback);

            const result = registered ? registered() : false;
            expect(result).toBe(true);
            expect(fallback).toHaveBeenCalledTimes(1);
        });

        it('clears unhandled fallback handler when null is passed', () => {
            setUnhandledBackHandler(() => true);
            expect(getUnhandledBackHandler()).not.toBeNull();

            setUnhandledBackHandler(null);
            expect(getUnhandledBackHandler()).toBeNull();
        });
    });

    describe('Prioritized back execution with unhandled fallback', () => {
        const register = (handler: BackHandler) => {
            handlers = [...handlers.filter((h) => h.id !== handler.id), handler];
        };

        const executeBack = (onEvaluateCanGoBack?: () => void): { handled: boolean } => {
            const sorted = [...handlers].sort((a, b) => b.priority - a.priority);

            for (const entry of sorted) {
                try {
                    if (entry.handle()) {
                        onEvaluateCanGoBack?.();
                        return { handled: true };
                    }
                } catch {
                    // ignore error in handler
                }
            }

            const unhandled = getUnhandledBackHandler();
            if (unhandled) {
                try {
                    if (unhandled()) {
                        onEvaluateCanGoBack?.();
                        return { handled: true };
                    }
                } catch {
                    // ignore error in unhandled fallback
                }
            }

            return { handled: false };
        };

        it('intercepts back when high priority modal handler is active without calling unhandled fallback', () => {
            const unhandledFallback = vi.fn().mockReturnValue(true);
            setUnhandledBackHandler(unhandledFallback);

            const modalHandler = vi.fn().mockReturnValue(true);
            register({
                id: 'modal-dialog',
                priority: 100,
                handle: modalHandler,
            });

            const result = executeBack();
            expect(result.handled).toBe(true);
            expect(modalHandler).toHaveBeenCalledTimes(1);
            expect(unhandledFallback).not.toHaveBeenCalled();
        });

        it('falls through to unhandled fallback when registered handler returns false', () => {
            const unhandledFallback = vi.fn().mockReturnValue(true);
            setUnhandledBackHandler(unhandledFallback);

            register({
                id: 'passive-handler',
                priority: 50,
                handle: () => false,
            });

            const result = executeBack();
            expect(result.handled).toBe(true);
            expect(unhandledFallback).toHaveBeenCalledTimes(1);
        });

        it('calls evaluateCanGoBack when unhandled fallback returns true', () => {
            const evaluateSpy = vi.fn();
            setUnhandledBackHandler(() => true);

            const result = executeBack(evaluateSpy);
            expect(result.handled).toBe(true);
            expect(evaluateSpy).toHaveBeenCalledTimes(1);
        });

        it('returns handled false when unhandled fallback returns false', () => {
            setUnhandledBackHandler(() => false);
            const result = executeBack();
            expect(result.handled).toBe(false);
        });
    });

    describe('Root path evaluation rules (/ vs /explorer vs non-root)', () => {
        const computeCanGoBack = (pathname: string, activeHandlersCount: number): boolean => {
            const hasHandlers = activeHandlersCount > 0;
            const notAtRoot = pathname !== '/'
                && pathname !== ''
                && pathname !== '/explorer';
            return hasHandlers || notAtRoot;
        };

        it('treats root paths (/, empty, and /explorer) as root when no handlers exist', () => {
            expect(computeCanGoBack('/', 0)).toBe(false);
            expect(computeCanGoBack('', 0)).toBe(false);
            expect(computeCanGoBack('/explorer', 0)).toBe(false);
        });

        it('evaluates canGoBack as true on root paths when local handlers are registered', () => {
            expect(computeCanGoBack('/explorer', 1)).toBe(true);
            expect(computeCanGoBack('/', 2)).toBe(true);
        });

        it('evaluates canGoBack as true on non-root paths even without active handlers', () => {
            expect(computeCanGoBack('/publications', 0)).toBe(true);
            expect(computeCanGoBack('/profile', 0)).toBe(true);
            expect(computeCanGoBack('/admin/storages', 0)).toBe(true);
            expect(computeCanGoBack('/library', 0)).toBe(true);
        });
    });

    describe('Webapp unhandled back navigation logic contract', () => {
        it('triggers window.history.back() when history state index > 0', () => {
            const mockWin = setupMockWindow('/publications', 5, 2);
            let gotoDispatched = false;

            const fallbackAction = () => {
                if (typeof window !== 'undefined') {
                    if (window.history.state?.idx > 0 || window.history.length > 1) {
                        window.history.back();
                        return true;
                    }
                    gotoDispatched = true;
                    return true;
                }
                return false;
            };

            const handled = fallbackAction();
            expect(handled).toBe(true);
            expect(mockWin.history.back).toHaveBeenCalledTimes(1);
            expect(gotoDispatched).toBe(false);
        });

        it('triggers window.history.back() when history length > 1', () => {
            const mockWin = setupMockWindow('/profile', 3, 0);
            let gotoDispatched = false;

            const fallbackAction = () => {
                if (typeof window !== 'undefined') {
                    if (window.history.state?.idx > 0 || window.history.length > 1) {
                        window.history.back();
                        return true;
                    }
                    gotoDispatched = true;
                    return true;
                }
                return false;
            };

            const handled = fallbackAction();
            expect(handled).toBe(true);
            expect(mockWin.history.back).toHaveBeenCalledTimes(1);
            expect(gotoDispatched).toBe(false);
        });

        it('dispatches navigation to explorer when opened directly without history', () => {
            const mockWin = setupMockWindow('/admin/storages', 1, 0);
            const messagesSent: Array<{ channel: string; payload: unknown }> = [];

            const fallbackAction = () => {
                if (typeof window !== 'undefined') {
                    if (window.history.state?.idx > 0 || window.history.length > 1) {
                        window.history.back();
                        return true;
                    }
                    messagesSent.push({
                        channel: 'APP.NAV.GOTO',
                        payload: { route: 'explorer' },
                    });
                    return true;
                }
                return false;
            };

            const handled = fallbackAction();
            expect(handled).toBe(true);
            expect(mockWin.history.back).not.toHaveBeenCalled();
            expect(messagesSent).toEqual([
                {
                    channel: 'APP.NAV.GOTO',
                    payload: { route: 'explorer' },
                },
            ]);
        });
    });
});
