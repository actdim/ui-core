import {
    type ComponentParams,
    type ComponentStruct,
    type Component,
    type ComponentDef,
} from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import {
    type LocaleCode,
    type LocaleDirection,
    type LocaleInfo,
    type LocalePreference,
    type LocaleSource,
    type LocaleChangedPayload,
    type I18nMsgStruct,
    type UiI18nMsgStruct,
    type I18nMsgChannels,
    type I18nServiceOptions,
} from './i18nTypes';
import { resolveLocale, resolveDirection } from './localeResolve';
import {
    createI18nRuntime,
    getI18nInstance,
    ensureNamespaces,
    registerResources,
} from './i18nRuntime';
import uiCoreEn from '../locales/en/ui-core.json';
import uiCoreRu from '../locales/ru/ui-core.json';

export const DEFAULT_LOCALE_STORAGE_KEY = 'actdim_locale_preference';

let activeStorageKey = DEFAULT_LOCALE_STORAGE_KEY;
let activeLocaleCallback: ((info: LocaleChangedPayload) => void) | null = null;
let activeMsgBus: MsgBus<I18nMsgStruct> | null = null;
let activeOptions: I18nServiceOptions | null = null;
let switchSequence = 0;

let cachedLocale: LocaleInfo = {
    preference: 'system',
    locale: 'en',
    dir: 'ltr',
};

export const getStoredLocalePreference = (
    storageKey: string = activeStorageKey,
): LocalePreference => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 'system';
    }

    try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored && typeof stored === 'string') {
            return stored;
        }
    } catch {
        // Fallback for sandboxed storage
    }

    return 'system';
};

export const setStoredLocalePreference = (
    preference: LocalePreference,
    storageKey: string = activeStorageKey,
): void => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        window.localStorage.setItem(storageKey, preference);
    } catch {
        // Fallback for quota or sandboxed storage
    }
};

export const getCurrentLocale = (): LocaleInfo => {
    return { ...cachedLocale };
};

export const applyLocaleToHtml = (locale: LocaleCode, dir: LocaleDirection): void => {
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('lang', locale);
        document.documentElement.setAttribute('dir', dir);
    }
};

export const updateLocalePreference = async (
    preference: LocalePreference,
    bus?: MsgBus<I18nMsgStruct>,
    source?: LocaleSource,
): Promise<void> => {
    const currentSeq = ++switchSequence;
    const supported = activeOptions?.supportedLocales ?? ['en'];
    const fallback = activeOptions?.fallbackLocale ?? 'en';
    const host = activeOptions?.hostLocale ? activeOptions.hostLocale() : undefined;

    const targetLocale = resolveLocale(
        preference,
        { stored: preference, host },
        supported,
        fallback,
    );

    // 1. Load missing namespaces for the target locale first (no flash of keys)
    const bootNs = ['ui-core', ...(activeOptions?.bootNamespaces ?? [])];
    await ensureNamespaces(bootNs, targetLocale);

    if (currentSeq !== switchSequence) {
        // A newer switch has superseded this one
        return;
    }

    // 2. Switch engine language
    const inst = getI18nInstance();
    await inst.changeLanguage(targetLocale);

    if (currentSeq !== switchSequence) {
        return;
    }

    // 3. Persist to storage
    setStoredLocalePreference(preference, activeStorageKey);

    const dir = resolveDirection(targetLocale);
    cachedLocale = { preference, locale: targetLocale, dir };

    // 4. Apply to HTML document
    applyLocaleToHtml(targetLocale, dir);

    // 5. Notify callback and bus
    const payload: LocaleChangedPayload = { ...cachedLocale, source };

    if (activeLocaleCallback) {
        try {
            activeLocaleCallback(payload);
        } catch (err) {
            console.error('Error in onLocaleChanged callback:', err);
        }
    }

    const targetBus = bus || activeMsgBus;
    if (targetBus) {
        targetBus.send({
            channel: 'APP.LOCALE.CHANGED',
            payload,
        });
    }
};

export const setLocalePreference = async (
    preference: LocalePreference,
    bus?: MsgBus<I18nMsgStruct>,
    source?: LocaleSource,
): Promise<void> => {
    await updateLocalePreference(preference, bus, source);
};

export const initLocaleService = async (
    msgBus: MsgBus<I18nMsgStruct>,
    options: I18nServiceOptions,
): Promise<() => void> => {
    activeMsgBus = msgBus;
    activeOptions = options;
    if (options.storageKey) {
        activeStorageKey = options.storageKey;
    }
    if (options.onLocaleChanged) {
        activeLocaleCallback = options.onLocaleChanged;
    }

    createI18nRuntime(options);

    // Register packaged ui-core resources synchronously
    registerResources('en', 'ui-core', uiCoreEn);
    registerResources('ru', 'ui-core', uiCoreRu);

    const preference = getStoredLocalePreference(activeStorageKey);
    const host = options.hostLocale ? options.hostLocale() : undefined;
    const targetLocale = resolveLocale(
        preference,
        { stored: preference, host },
        options.supportedLocales,
        options.fallbackLocale,
    );

    const bootNs = ['ui-core', ...(options.bootNamespaces ?? [])];
    await ensureNamespaces(bootNs, targetLocale);

    const inst = getI18nInstance();
    await inst.changeLanguage(targetLocale);

    const dir = resolveDirection(targetLocale);
    cachedLocale = { preference, locale: targetLocale, dir };

    applyLocaleToHtml(targetLocale, dir);

    const payload: LocaleChangedPayload = { ...cachedLocale };

    if (activeLocaleCallback) {
        try {
            activeLocaleCallback(payload);
        } catch (err) {
            console.error('Error in onLocaleChanged callback:', err);
        }
    }

    msgBus.send({
        channel: 'APP.LOCALE.CHANGED',
        payload,
    });

    let isDisposed = false;

    msgBus.on({
        channel: 'APP.LOCALE.SET_PREFERENCE',
        group: 'in',
        callback: (msg) => {
            if (isDisposed) {
                return;
            }
            if (msg.payload?.preference) {
                void updateLocalePreference(msg.payload.preference, msgBus, msg.payload.source);
            }
        },
    });

    return () => {
        isDisposed = true;
        if (activeMsgBus === msgBus) {
            activeMsgBus = null;
        }
        activeLocaleCallback = null;
    };
};

export type LocaleServiceStruct<TMsg extends UiI18nMsgStruct = UiI18nMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: LocaleInfo;
        msgScope: {
            subscribe: I18nMsgChannels<'APP.LOCALE.CHANGED'>;
        };
    }
>;

export const useLocaleService = (
    params: ComponentParams<LocaleServiceStruct>,
): Component<LocaleServiceStruct> => {
    let c: Component<LocaleServiceStruct>;

    const initialLocale = getCurrentLocale();

    const def: ComponentDef<LocaleServiceStruct> = {
        props: initialLocale,
        msgBroker: {
            subscribe: {
                'APP.LOCALE.CHANGED': {
                    in: {
                        callback: (msg) => {
                            if (msg.payload) {
                                c.model.preference = msg.payload.preference;
                                c.model.locale = msg.payload.locale;
                                c.model.dir = msg.payload.dir;
                            }
                        },
                    },
                },
            },
        },
        view: () => {
            return null;
        },
    };

    c = useComponent(def, params);

    return c;
};

export const LocaleService = toReact(useLocaleService);
