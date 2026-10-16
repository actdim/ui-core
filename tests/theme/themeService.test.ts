import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    getStoredThemePreference,
    setStoredThemePreference,
    resolveSystemThemeMode,
    resolveThemeMode,
    applyThemeToHtml,
    applyThemeToMeta,
    initThemeService,
    setThemePreference,
    getCurrentTheme,
    DEFAULT_THEME_STORAGE_KEY,
} from '@/theme/ThemeService';
import { createMuiAppTheme } from '@/theme/muiTheme';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import { type ThemePreference, type ThemeMsgStruct, type ThemeInfo } from '@/theme/themeTypes';

type MockElement = {
    tagName: string;
    classList: {
        contains: (cls: string) => boolean;
        add: (cls: string) => void;
        remove: (cls: string) => void;
    };
    attributes: Map<string, string>;
    setAttribute: (name: string, value: string) => void;
    getAttribute: (name: string) => string | null;
    removeAttribute: (name: string) => void;
};

type MockDocument = {
    documentElement: MockElement;
    head: {
        appendChild: (el: unknown) => void;
    };
    createElement: (tag: string) => MockElement;
    querySelectorAll: (selector: string) => MockElement[];
};

type MockWindow = {
    document: MockDocument;
    localStorage: {
        getItem: (k: string) => string | null;
        setItem: (k: string, v: string) => void;
        removeItem: (k: string) => void;
    };
    matchMedia: (query: string) => {
        matches: boolean;
        media: string;
        addEventListener: (event: string, cb: (e: { matches: boolean }) => void) => void;
        removeEventListener: (event: string, cb: (e: { matches: boolean }) => void) => void;
    };
};

const createMockElement = (tag: string): MockElement => {
    const attributes = new Map<string, string>();
    const classes = new Set<string>();

    return {
        tagName: tag.toUpperCase(),
        classList: {
            contains: (cls: string) => classes.has(cls),
            add: (cls: string) => classes.add(cls),
            remove: (cls: string) => classes.delete(cls),
        },
        attributes,
        setAttribute: (name: string, value: string) => {
            attributes.set(name, value);
        },
        getAttribute: (name: string) => {
            return attributes.get(name) ?? null;
        },
        removeAttribute: (name: string) => {
            attributes.delete(name);
        },
    };
};

const createMockWindow = (initialMatchesDark = false): MockWindow => {
    const storage = new Map<string, string>();
    const metaElements: MockElement[] = [];

    const doc: MockDocument = {
        documentElement: createMockElement('html'),
        head: {
            appendChild: (el: unknown) => {
                if ((el as MockElement).tagName === 'META') {
                    metaElements.push(el as MockElement);
                }
            },
        },
        createElement: (tag: string) => createMockElement(tag),
        querySelectorAll: (selector: string) => {
            if (selector.includes('meta')) {
                return metaElements;
            }
            return [];
        },
    };

    let mediaMatches = initialMatchesDark;
    const mediaListeners = new Set<(e: { matches: boolean }) => void>();

    return {
        document: doc,
        localStorage: {
            getItem: (k: string) => storage.get(k) ?? null,
            setItem: (k: string, v: string) => storage.set(k, v),
            removeItem: (k: string) => storage.delete(k),
        },
        matchMedia: (query: string) => ({
            matches: mediaMatches,
            media: query,
            addEventListener: (_event: string, cb: (e: { matches: boolean }) => void) => {
                mediaListeners.add(cb);
            },
            removeEventListener: (_event: string, cb: (e: { matches: boolean }) => void) => {
                mediaListeners.delete(cb);
            },
        }),
    };
};

describe('ThemeService in @actdim/ui-core', () => {
    let mockWin: MockWindow;
    let originalWindow: unknown;
    let originalDocument: unknown;

    beforeEach(() => {
        mockWin = createMockWindow(false);
        originalWindow = (globalThis as Record<string, unknown>).window;
        originalDocument = (globalThis as Record<string, unknown>).document;

        (globalThis as Record<string, unknown>).window = mockWin;
        (globalThis as Record<string, unknown>).document = mockWin.document;
    });

    afterEach(() => {
        if (originalWindow === undefined) {
            delete (globalThis as Record<string, unknown>).window;
        } else {
            (globalThis as Record<string, unknown>).window = originalWindow;
        }

        if (originalDocument === undefined) {
            delete (globalThis as Record<string, unknown>).document;
        } else {
            (globalThis as Record<string, unknown>).document = originalDocument;
        }
    });

    it('resolves explicit light and dark preferences regardless of system setting', () => {
        expect(resolveThemeMode('dark', 'light')).toBe('dark');
        expect(resolveThemeMode('light', 'dark')).toBe('light');
    });

    it('resolves system preference according to system mode', () => {
        expect(resolveThemeMode('system', 'dark')).toBe('dark');
        expect(resolveThemeMode('system', 'light')).toBe('light');
    });

    it('reads matchMedia when system mode is not passed explicitly', () => {
        expect(resolveSystemThemeMode()).toBe('light');
        mockWin = createMockWindow(true);
        (globalThis as Record<string, unknown>).window = mockWin;
        expect(resolveSystemThemeMode()).toBe('dark');
    });

    it('persists and loads theme preference from localStorage', () => {
        expect(getStoredThemePreference()).toBe('system');
        setStoredThemePreference('dark');
        expect(getStoredThemePreference()).toBe('dark');
        setStoredThemePreference('light');
        expect(getStoredThemePreference()).toBe('light');
    });

    it('applies theme attributes and classes to HTML documentElement', () => {
        applyThemeToHtml('dark');
        expect(mockWin.document.documentElement.classList.contains('dark')).toBe(true);
        expect(mockWin.document.documentElement.getAttribute('data-theme')).toBe('dark');

        applyThemeToHtml('light');
        expect(mockWin.document.documentElement.classList.contains('dark')).toBe(false);
        expect(mockWin.document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('updates theme-color meta tag content for light and dark modes', () => {
        applyThemeToMeta('dark');
        const darkMetas = mockWin.document.querySelectorAll('meta[name="theme-color"]');
        expect(darkMetas.length).toBeGreaterThan(0);
        expect(darkMetas[0].getAttribute('content')).toBe('#0f172a');

        applyThemeToMeta('light');
        const lightMetas = mockWin.document.querySelectorAll('meta[name="theme-color"]');
        expect(lightMetas[0].getAttribute('content')).toBe('#ffffff');
    });

    it('notifies onThemeChanged callback when provided in options', () => {
        const onThemeChanged = vi.fn();
        const sent: Array<{ channel: string; payload: unknown }> = [];
        const mockBus = {
            send: (msg: { channel: string; payload: unknown }) => {
                sent.push(msg);
            },
            on: () => () => {},
        } as unknown as MsgBus<ThemeMsgStruct>;

        const dispose = initThemeService(mockBus, { onThemeChanged });
        expect(onThemeChanged).toHaveBeenCalledWith(expect.objectContaining({ preference: 'system' }));

        setThemePreference('dark', mockBus);
        expect(onThemeChanged).toHaveBeenCalledWith(expect.objectContaining({ preference: 'dark', mode: 'dark' }));

        dispose();
    });

    it('builds light and dark MUI themes with corresponding palette mode and background tokens', () => {
        const lightTheme = createMuiAppTheme('light');
        expect(lightTheme.palette.mode).toBe('light');
        expect(lightTheme.palette.background.default).toBe('#f8fafc');
        expect(lightTheme.palette.background.paper).toBe('#ffffff');

        const darkTheme = createMuiAppTheme('dark');
        expect(darkTheme.palette.mode).toBe('dark');
        expect(darkTheme.palette.background.default).toBe('#020617');
        expect(darkTheme.palette.background.paper).toBe('#0f172a');
    });
});
