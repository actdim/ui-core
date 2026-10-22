// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import { createI18nRuntime, registerResources } from '@/i18n/i18nRuntime';
import { initLocaleService } from '@/i18n/LocaleService';
import { useLocale, useT } from '@/i18n/useT';
import { type I18nMsgStruct } from '@/i18n/i18nTypes';

// Renders real components: unit tests of the snapshot getter alone missed both an infinite
// useSyncExternalStore loop and components that never re-rendered after namespaces loaded.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
    const t = useT('probe');
    const { locale } = useLocale();
    return createElement('span', { 'data-testid': 'probe' }, `${locale}:${t('hello')}`);
}

const createMockBus = (): {
    bus: MsgBus<I18nMsgStruct>;
    trigger: (channel: string, payload: unknown) => void;
} => {
    const subscribers = new Map<string, Array<(msg: { channel: string; payload: unknown }) => void>>();
    const bus = {
        send: vi.fn(),
        on: vi.fn((options: { channel: string; callback: (msg: { channel: string; payload: unknown }) => void }) => {
            const list = subscribers.get(options.channel) || [];
            list.push(options.callback);
            subscribers.set(options.channel, list);
        }),
    } as unknown as MsgBus<I18nMsgStruct>;

    const trigger = (channel: string, payload: unknown) => {
        for (const cb of subscribers.get(channel) || []) {
            cb({ channel, payload });
        }
    };

    return { bus, trigger };
};

describe('useT / useLocale rendering', () => {
    let container: HTMLDivElement;
    let root: Root;
    let consoleError: ReturnType<typeof vi.spyOn>;

    const renderedText = (): string => container.querySelector('[data-testid="probe"]')?.textContent ?? '';

    const reactLoopErrors = (): unknown[][] =>
        consoleError.mock.calls.filter((args) =>
            args.some((arg) => /Maximum update depth|getSnapshot should be cached/.test(String(arg))),
        );

    beforeEach(() => {
        consoleError = vi.spyOn(console, 'error');
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
        consoleError.mockRestore();
    });

    it('re-renders translated text when a namespace is registered after mount', () => {
        createI18nRuntime({ supportedLocales: ['en', 'ru'], fallbackLocale: 'en' });

        act(() => {
            root.render(createElement(Probe));
        });
        expect(renderedText()).toBe('en:hello');

        act(() => {
            registerResources('en', 'probe', { hello: 'Hello' });
        });
        expect(renderedText()).toBe('en:Hello');
        expect(reactLoopErrors()).toEqual([]);
    });

    it('re-renders locale and text after a locale switch', async () => {
        const { bus, trigger } = createMockBus();
        const dispose = await initLocaleService(bus, { supportedLocales: ['en', 'ru'], fallbackLocale: 'en' });
        registerResources('en', 'probe', { hello: 'Hello' });
        registerResources('ru', 'probe', { hello: 'Privet' });

        await act(async () => {
            root.render(createElement(Probe));
        });
        const initialLocale = renderedText().split(':')[0];
        const targetLocale = initialLocale === 'ru' ? 'en' : 'ru';

        await act(async () => {
            trigger('APP.LOCALE.SET_PREFERENCE', { preference: targetLocale, source: 'user' });
            await new Promise((resolve) => setTimeout(resolve, 50));
        });

        expect(renderedText()).toBe(targetLocale === 'ru' ? 'ru:Privet' : 'en:Hello');
        expect(reactLoopErrors()).toEqual([]);
        dispose();
    });
});
