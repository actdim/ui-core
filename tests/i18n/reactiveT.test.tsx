// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { bind } from '@actdim/dynstruct/componentModel/core';
import type {
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@actdim/dynstruct/componentModel/contracts';
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';
import { registerResources, t } from '@/i18n/i18nRuntime';
import { formatNumber, formatDate } from '@/i18n/formatters';
import { initLocaleService } from '@/i18n/LocaleService';
import { type I18nMsgStruct } from '@/i18n/i18nTypes';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

type CombinedMsgStruct = BaseAppMsgStruct & I18nMsgStruct;

const createMockBus = (): {
    bus: MsgBus<CombinedMsgStruct>;
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
    } as unknown as MsgBus<CombinedMsgStruct>;

    const trigger = (channel: string, payload: unknown) => {
        for (const cb of subscribers.get(channel) || []) {
            cb({ channel, payload });
        }
    };

    return { bus, trigger };
};

describe('reactive t() and formatters in dynstruct views', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
    });

    it('updates view, child bound prop, and formatters on locale switch without remounting', async () => {
        const { bus, trigger } = createMockBus();

        const disposeService = await initLocaleService(bus, {
            supportedLocales: ['en', 'ru'],
            fallbackLocale: 'en',
        });

        registerResources('en', 'probe', { key: 'Hello English' });
        registerResources('ru', 'probe', { key: 'Привет русский' });

        type ChildStruct = ComponentStruct<CombinedMsgStruct, {
            props: { label: string };
        }>;
        const useChild = (params?: ComponentParams<ChildStruct>) => {
            let m: ComponentModel<ChildStruct>;
            const def: ComponentDef<ChildStruct> = {
                regType: 'ChildNode',
                props: { label: '' },
                view: () => <span data-testid="child-label">{m.label}</span>,
            };
            const c = useComponent(def, params);
            m = c.model;

            return c;
        };

        type ParentStruct = ComponentStruct<CombinedMsgStruct, {
            props: { count: number };
            actions: { increment: () => void };
        }>;

        let capturedModel: ComponentModel<ParentStruct> | undefined;
        let renderedInstanceId = '';

        const useParent = (params?: ComponentParams<ParentStruct>) => {
            let m: ComponentModel<ParentStruct>;
            const child = useChild({
                label: bind(() => t('probe:key')),
            });
            const def: ComponentDef<ParentStruct> = {
                regType: 'ParentNode',
                props: { count: 0 },
                actions: {
                    increment: () => {
                        m.count++;
                    },
                },
                view: () => (
                    <div>
                        <span data-testid="parent-text">{t('probe:key')}</span>
                        <span data-testid="parent-count">{m.count}</span>
                        <span data-testid="formatted-number">{formatNumber(1234567)}</span>
                        <span data-testid="formatted-date">{formatDate(new Date(2026, 4, 15))}</span>
                        <child.View />
                    </div>
                ),
            };
            const c = useComponent(def, params);
            m = c.model;
            capturedModel = m;
            renderedInstanceId = c.id;

            return c;
        };

        const Parent = toReact(useParent);

        act(() => {
            root.render(
                <ComponentContextProvider value={{ msgBus: bus }}>
                    <Parent />
                </ComponentContextProvider>,
            );
        });

        expect(container.querySelector('[data-testid="parent-text"]')?.textContent).toBe('Hello English');
        expect(container.querySelector('[data-testid="child-label"]')?.textContent).toBe('Hello English');
        expect(container.querySelector('[data-testid="parent-count"]')?.textContent).toBe('0');
        expect(container.querySelector('[data-testid="formatted-number"]')?.textContent).toBe('1,234,567');
        expect(container.querySelector('[data-testid="formatted-date"]')?.textContent).toContain('May');

        const initialInstanceId = renderedInstanceId;

        // Mutate model state
        act(() => {
            capturedModel?.increment();
            capturedModel?.increment();
        });
        expect(container.querySelector('[data-testid="parent-count"]')?.textContent).toBe('2');

        // Switch locale via message bus
        await act(async () => {
            trigger('APP.LOCALE.SET_PREFERENCE', {
                preference: 'ru',
                source: 'user',
            });
            await new Promise((resolve) => setTimeout(resolve, 60));
        });

        // Both view and bound prop updated
        expect(container.querySelector('[data-testid="parent-text"]')?.textContent).toBe('Привет русский');
        expect(container.querySelector('[data-testid="child-label"]')?.textContent).toBe('Привет русский');
        expect(container.querySelector('[data-testid="formatted-number"]')?.textContent).not.toBe('1,234,567');
        expect(container.querySelector('[data-testid="formatted-date"]')?.textContent).toContain('мая');

        // State preserved and component instance NOT remounted
        expect(container.querySelector('[data-testid="parent-count"]')?.textContent).toBe('2');
        expect(renderedInstanceId).toBe(initialInstanceId);

        disposeService();
    });
});
