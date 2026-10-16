import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    resolveCurrentLayout,
    applyLayoutAttributesToHtml,
    applySafeAreaToCssVariables,
    initLayoutService,
    getCurrentLayout,
} from '../../src/layout/LayoutService';
import { muiBreakpoints } from '../../src/theme/muiTheme';
import { type LayoutMsgStruct } from '../../src/layout/layoutTypes';
import { type MsgBus } from '@actdim/msgmesh/contracts';

type MockDocument = {
    documentElement: {
        attributes: Map<string, string>;
        style: {
            properties: Map<string, string>;
            setProperty: (k: string, v: string) => void;
            getPropertyValue: (k: string) => string;
        };
        setAttribute: (name: string, value: string) => void;
        getAttribute: (name: string) => string | null;
        removeAttribute: (name: string) => void;
    };
};

type MockWindow = {
    innerWidth: number;
    innerHeight: number;
    document: MockDocument;
    matchMedia: (query: string) => {
        matches: boolean;
        media: string;
        addEventListener: (event: string, cb: () => void) => void;
        removeEventListener: (event: string, cb: () => void) => void;
    };
    addEventListener: (type: string, listener: (ev: unknown) => void) => void;
    removeEventListener: (type: string, listener: (ev: unknown) => void) => void;
};

const createMockWindow = (width = 1200, height = 800): MockWindow => {
    const attributes = new Map<string, string>();
    const properties = new Map<string, string>();

    const doc: MockDocument = {
        documentElement: {
            attributes,
            style: {
                properties,
                setProperty: (k: string, v: string) => {
                    properties.set(k, v);
                },
                getPropertyValue: (k: string) => {
                    return properties.get(k) || '';
                },
            },
            setAttribute: (name: string, value: string) => {
                attributes.set(name, value);
            },
            getAttribute: (name: string) => {
                return attributes.get(name) ?? null;
            },
            removeAttribute: (name: string) => {
                attributes.delete(name);
            },
        },
    };

    const win: MockWindow = {
        innerWidth: width,
        innerHeight: height,
        document: doc,
        matchMedia: vi.fn().mockImplementation((query: string) => {
            let matches = false;
            const currentW = win.innerWidth;
            const currentH = win.innerHeight;
            if (query === '(min-width: 48rem)') {
                matches = currentW >= 768;
            } else if (query === '(min-width: 64rem)') {
                matches = currentW >= 1024;
            } else if (query === '(pointer: coarse)') {
                matches = false;
            } else if (query === '(orientation: portrait)') {
                matches = currentH > currentW;
            }
            return {
                matches,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            };
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    };

    return win;
};

describe('Adaptive Layout Foundation', () => {
    const originalGlobalWindow = (globalThis as unknown as { window?: unknown }).window;
    const originalGlobalDocument = (globalThis as unknown as { document?: unknown }).document;
    let mockWin: MockWindow;

    beforeEach(() => {
        mockWin = createMockWindow(1280, 800);
        (globalThis as unknown as { window: unknown }).window = mockWin;
        (globalThis as unknown as { document: unknown }).document = mockWin.document;
    });

    afterEach(() => {
        if (originalGlobalWindow !== undefined) {
            (globalThis as unknown as { window: unknown }).window = originalGlobalWindow;
        } else {
            delete (globalThis as unknown as { window?: unknown }).window;
        }
        if (originalGlobalDocument !== undefined) {
            (globalThis as unknown as { document: unknown }).document = originalGlobalDocument;
        } else {
            delete (globalThis as unknown as { document?: unknown }).document;
        }
    });

    it('aligns MUI breakpoints with Tailwind v4 thresholds', () => {
        expect(muiBreakpoints.values.sm).toBe(640);
        expect(muiBreakpoints.values.md).toBe(768);
        expect(muiBreakpoints.values.lg).toBe(1024);
        expect(muiBreakpoints.values.xl).toBe(1280);
    });

    it('resolves compact tier when width is under 768px', () => {
        mockWin.innerWidth = 390;
        mockWin.innerHeight = 844;
        const layout = resolveCurrentLayout();
        expect(layout.tier).toBe('compact');
        expect(layout.orientation).toBe('portrait');
    });

    it('resolves medium tier between 768px and 1023px', () => {
        mockWin.innerWidth = 820;
        mockWin.innerHeight = 1180;
        const layout = resolveCurrentLayout();
        expect(layout.tier).toBe('medium');
    });

    it('resolves expanded tier for widths 1024px and greater', () => {
        mockWin.innerWidth = 1440;
        mockWin.innerHeight = 900;
        const layout = resolveCurrentLayout();
        expect(layout.tier).toBe('expanded');
        expect(layout.orientation).toBe('landscape');
    });

    it('applies data-tier and data-pointer attributes to html element', () => {
        applyLayoutAttributesToHtml({
            tier: 'compact',
            pointer: 'coarse',
            orientation: 'portrait',
            safeArea: { top: 47, right: 0, bottom: 34, left: 0 },
        });

        expect(mockWin.document.documentElement.getAttribute('data-tier')).toBe('compact');
        expect(mockWin.document.documentElement.getAttribute('data-pointer')).toBe('coarse');
    });

    it('applies safe-area insets to CSS custom properties', () => {
        applySafeAreaToCssVariables({
            top: 44,
            right: 0,
            bottom: 34,
            left: 0,
        });

        const style = mockWin.document.documentElement.style;
        expect(style.getPropertyValue('--safe-top')).toBe('44px');
        expect(style.getPropertyValue('--safe-bottom')).toBe('34px');
    });

    it('initializes LayoutService and publishes APP.LAYOUT.CHANGED on MsgBus', () => {
        const sentMessages: Array<{ channel: string; payload: unknown }> = [];
        const mockMsgBus = {
            send: vi.fn().mockImplementation((msg: { channel: string; payload: unknown }) => {
                sentMessages.push(msg);
                return Promise.resolve();
            }),
            on: vi.fn().mockReturnValue('sub-1'),
            off: vi.fn(),
        } as unknown as MsgBus<LayoutMsgStruct>;

        mockWin.innerWidth = 820;
        const cleanup = initLayoutService(mockMsgBus);

        expect(mockMsgBus.send).toHaveBeenCalledWith(
            expect.objectContaining({
                channel: 'APP.LAYOUT.CHANGED',
                payload: expect.objectContaining({
                    tier: 'medium',
                }),
            }),
        );

        cleanup();
    });

    it('returns cached layout via getCurrentLayout', () => {
        const layout = getCurrentLayout();
        expect(layout).toBeDefined();
        expect(layout.tier).toBeDefined();
    });
});
