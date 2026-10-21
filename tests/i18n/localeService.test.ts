import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    initLocaleService,
    getCurrentLocale,
    getStoredLocalePreference,
    setStoredLocalePreference,
    setLocalePreference,
    applyLocaleToHtml,
    DEFAULT_LOCALE_STORAGE_KEY,
} from '@/i18n/LocaleService';
import { t } from '@/i18n/i18nRuntime';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import { type I18nMsgStruct, type LocaleChangedPayload } from '@/i18n/i18nTypes';

type MockElement = {
    tagName: string;
    attributes: Map<string, string>;
    setAttribute: (name: string, value: string) => void;
    getAttribute: (name: string) => string | null;
    removeAttribute: (name: string) => void;
};

type MockDocument = {
    documentElement: MockElement;
};

type MockWindow = {
    document: MockDocument;
    localStorage: {
        getItem: (k: string) => string | null;
        setItem: (k: string, v: string) => void;
        removeItem: (k: string) => void;
    };
};

const createMockElement = (tag: string): MockElement => {
    const attributes = new Map<string, string>();

    return {
        tagName: tag.toUpperCase(),
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

const createMockWindow = (): MockWindow => {
    const storage = new Map<string, string>();
    const doc: MockDocument = {
        documentElement: createMockElement('html'),
    };

    return {
        document: doc,
        localStorage: {
            getItem: (k: string) => storage.get(k) ?? null,
            setItem: (k: string, v: string) => storage.set(k, v),
            removeItem: (k: string) => storage.delete(k),
        },
    };
};

const createMockBus = (): {
    bus: MsgBus<I18nMsgStruct>;
    sentMessages: Array<{ channel: string; payload: unknown }>;
    trigger: (channel: string, payload: unknown) => void;
} => {
    const sentMessages: Array<{ channel: string; payload: unknown }> = [];
    const subscribers = new Map<string, Array<(msg: { channel: string; payload: any }) => void>>();

    const bus = {
        send: vi.fn((msg: { channel: string; payload: unknown }) => {
            sentMessages.push(msg);
        }),
        on: vi.fn((options: { channel: string; callback: (msg: any) => void }) => {
            const list = subscribers.get(options.channel) || [];
            list.push(options.callback);
            subscribers.set(options.channel, list);
        }),
    } as unknown as MsgBus<I18nMsgStruct>;

    const trigger = (channel: string, payload: unknown) => {
        const list = subscribers.get(channel) || [];
        for (const cb of list) {
            cb({ channel, payload });
        }
    };

    return { bus, sentMessages, trigger };
};

describe('LocaleService in @actdim/ui-core', () => {
    let mockWin: MockWindow;
    let originalWindow: unknown;
    let originalDocument: unknown;

    beforeEach(() => {
        mockWin = createMockWindow();
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

    it('persists and loads locale preference from localStorage', () => {
        expect(getStoredLocalePreference()).toBe('system');

        setStoredLocalePreference('ru');
        expect(getStoredLocalePreference()).toBe('ru');

        setStoredLocalePreference('en');
        expect(getStoredLocalePreference()).toBe('en');
    });

    it('applies locale and dir attributes to HTML document element', () => {
        applyLocaleToHtml('ru', 'ltr');
        expect(mockWin.document.documentElement.getAttribute('lang')).toBe('ru');
        expect(mockWin.document.documentElement.getAttribute('dir')).toBe('ltr');

        applyLocaleToHtml('ar', 'rtl');
        expect(mockWin.document.documentElement.getAttribute('lang')).toBe('ar');
        expect(mockWin.document.documentElement.getAttribute('dir')).toBe('rtl');
    });

    it('initializes service, registers bundled ui-core resources, and emits APP.LOCALE.CHANGED', async () => {
        const { bus, sentMessages } = createMockBus();
        const onLocaleChanged = vi.fn();

        const dispose = await initLocaleService(bus, {
            supportedLocales: ['en', 'ru'],
            fallbackLocale: 'en',
            onLocaleChanged,
        });

        // Verifies APP.LOCALE.CHANGED message was sent
        expect(sentMessages.length).toBeGreaterThan(0);
        const lastMsg = sentMessages[sentMessages.length - 1];
        expect(lastMsg.channel).toBe('APP.LOCALE.CHANGED');
        expect((lastMsg.payload as LocaleChangedPayload).locale).toBe('en');
        expect((lastMsg.payload as LocaleChangedPayload).dir).toBe('ltr');

        // Callback notified
        expect(onLocaleChanged).toHaveBeenCalledWith(
            expect.objectContaining({ locale: 'en', dir: 'ltr' }),
        );

        // Document element updated
        expect(mockWin.document.documentElement.getAttribute('lang')).toBe('en');
        expect(mockWin.document.documentElement.getAttribute('dir')).toBe('ltr');

        // Bundled strings accessible
        expect(t('dialog.close', { ns: 'ui-core' })).toBe('Close');
        expect(t('dialog.back', { ns: 'ui-core' })).toBe('Back');

        dispose();
    });

    it('switches language on APP.LOCALE.SET_PREFERENCE, updates HTML, and persists to storage', async () => {
        const { bus, sentMessages, trigger } = createMockBus();

        const dispose = await initLocaleService(bus, {
            supportedLocales: ['en', 'ru'],
            fallbackLocale: 'en',
        });

        sentMessages.length = 0;

        // Trigger preference change to Russian with server source
        trigger('APP.LOCALE.SET_PREFERENCE', {
            preference: 'ru',
            source: 'server',
        });

        // Allow async switch to settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(getCurrentLocale().locale).toBe('ru');
        expect(mockWin.document.documentElement.getAttribute('lang')).toBe('ru');
        expect(mockWin.localStorage.getItem(DEFAULT_LOCALE_STORAGE_KEY)).toBe('ru');

        // Checks bundled Russian strings
        expect(t('dialog.close', { ns: 'ui-core' })).toBe('Закрыть');
        expect(t('dialog.back', { ns: 'ui-core' })).toBe('Назад');

        // Confirms notification emitted with source echoed
        const changedMsg = sentMessages.find((m) => m.channel === 'APP.LOCALE.CHANGED');
        expect(changedMsg).toBeDefined();
        expect((changedMsg!.payload as LocaleChangedPayload).locale).toBe('ru');
        expect((changedMsg!.payload as LocaleChangedPayload).source).toBe('server');

        dispose();
    });

    it('stops listening when disposer is called', async () => {
        const { bus, sentMessages, trigger } = createMockBus();

        const dispose = await initLocaleService(bus, {
            supportedLocales: ['en', 'ru'],
            fallbackLocale: 'en',
        });

        dispose();
        sentMessages.length = 0;

        trigger('APP.LOCALE.SET_PREFERENCE', {
            preference: 'ru',
            source: 'user',
        });

        await new Promise((resolve) => setTimeout(resolve, 50));

        // After disposal, sentMessages should remain empty
        expect(sentMessages.length).toBe(0);
    });
});
