import {
    type ComponentParams,
    type ComponentStruct,
    type Component,
    type ComponentDef,
} from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import {
    type ThemeInfo,
    type ThemeMode,
    type ThemePreference,
    type ThemeMsgStruct,
    type UiThemeMsgStruct,
    type ThemeMsgChannels,
    type ThemeServiceOptions,
} from './themeTypes';

export const DEFAULT_THEME_STORAGE_KEY = 'actdim_theme_preference';

let activeStorageKey = DEFAULT_THEME_STORAGE_KEY;
let activeThemeCallback: ((info: ThemeInfo) => void) | null = null;
let activeMsgBus: MsgBus<ThemeMsgStruct> | null = null;

let cachedTheme: ThemeInfo = {
    preference: 'system',
    mode: 'light',
};

export const getStoredThemePreference = (storageKey: string = activeStorageKey): ThemePreference => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 'system';
    }

    try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch {
        // Fallback for sandboxed storage
    }

    return 'system';
};

export const setStoredThemePreference = (
    preference: ThemePreference,
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

export const resolveSystemThemeMode = (): ThemeMode => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    }

    return 'light';
};

export const resolveThemeMode = (
    preference: ThemePreference,
    systemMode?: ThemeMode,
): ThemeMode => {
    if (preference === 'dark') {
        return 'dark';
    }

    if (preference === 'light') {
        return 'light';
    }

    return systemMode ?? resolveSystemThemeMode();
};

export const getCurrentTheme = (): ThemeInfo => {
    return { ...cachedTheme };
};

export const applyThemeToHtml = (mode: ThemeMode): void => {
    if (typeof document !== 'undefined' && document.documentElement) {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.documentElement.setAttribute('data-theme', mode);
    }
};

export const applyThemeToMeta = (mode: ThemeMode): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const color = mode === 'dark' ? '#0f172a' : '#ffffff';
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    if (metaTags.length > 0) {
        metaTags.forEach((meta) => {
            meta.setAttribute('content', color);
        });
    } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute('content', color);
        document.head.appendChild(meta);
    }
};

export const updateThemePreference = (
    preference: ThemePreference,
    bus?: MsgBus<ThemeMsgStruct>,
): void => {
    setStoredThemePreference(preference);
    const mode = resolveThemeMode(preference);
    cachedTheme = { preference, mode };

    applyThemeToHtml(mode);
    applyThemeToMeta(mode);

    if (activeThemeCallback) {
        try {
            activeThemeCallback({ ...cachedTheme });
        } catch (err) {
            console.error('Error in onThemeChanged callback:', err);
        }
    }

    const targetBus = bus || activeMsgBus;
    if (targetBus) {
        targetBus.send({
            channel: 'APP.THEME.CHANGED',
            payload: { ...cachedTheme },
        });
    }
};

export const setThemePreference = (
    preference: ThemePreference,
    bus?: MsgBus<ThemeMsgStruct>,
): void => {
    updateThemePreference(preference, bus);
};

export const initThemeService = (
    msgBus: MsgBus<ThemeMsgStruct>,
    options?: ThemeServiceOptions,
): () => void => {
    activeMsgBus = msgBus;
    if (options?.storageKey) {
        activeStorageKey = options.storageKey;
    }
    if (options?.onThemeChanged) {
        activeThemeCallback = options.onThemeChanged;
    }

    const preference = getStoredThemePreference();
    const mode = resolveThemeMode(preference);
    cachedTheme = { preference, mode };

    applyThemeToHtml(mode);
    applyThemeToMeta(mode);

    if (activeThemeCallback) {
        try {
            activeThemeCallback({ ...cachedTheme });
        } catch (err) {
            console.error('Error in onThemeChanged callback:', err);
        }
    }

    msgBus.send({
        channel: 'APP.THEME.CHANGED',
        payload: { ...cachedTheme },
    });

    let isDisposed = false;

    const handleSystemChange = (e?: MediaQueryListEvent) => {
        if (isDisposed) {
            return;
        }

        if (cachedTheme.preference === 'system') {
            const systemDark = e !== undefined ? e.matches : resolveSystemThemeMode() === 'dark';
            const nextMode: ThemeMode = systemDark ? 'dark' : 'light';
            if (nextMode !== cachedTheme.mode) {
                cachedTheme.mode = nextMode;
                applyThemeToHtml(nextMode);
                applyThemeToMeta(nextMode);
                if (activeThemeCallback) {
                    try {
                        activeThemeCallback({ ...cachedTheme });
                    } catch (err) {
                        console.error('Error in onThemeChanged callback:', err);
                    }
                }
                msgBus.send({
                    channel: 'APP.THEME.CHANGED',
                    payload: { ...cachedTheme },
                });
            }
        }
    };

    let mql: MediaQueryList | null = null;
    if (typeof window !== 'undefined' && window.matchMedia) {
        try {
            mql = window.matchMedia('(prefers-color-scheme: dark)');
            mql.addEventListener('change', handleSystemChange);
        } catch {
            // Fallback for older browser environments
        }
    }

    msgBus.on({
        channel: 'APP.THEME.SET_PREFERENCE',
        group: 'in',
        callback: (msg) => {
            if (isDisposed) {
                return;
            }
            if (msg.payload?.preference) {
                updateThemePreference(msg.payload.preference, msgBus);
            }
        },
    });

    return () => {
        isDisposed = true;
        if (mql) {
            mql.removeEventListener('change', handleSystemChange);
        }
        if (activeMsgBus === msgBus) {
            activeMsgBus = null;
        }
        activeThemeCallback = null;
    };
};

export type ThemeServiceStruct<TMsg extends UiThemeMsgStruct = UiThemeMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: ThemeInfo;
        msgScope: {
            subscribe: ThemeMsgChannels<'APP.THEME.CHANGED'>;
        };
    }
>;

export const useThemeService = (params: ComponentParams<ThemeServiceStruct>) => {
    let c: Component<ThemeServiceStruct>;

    const initialTheme = getCurrentTheme();

    const def: ComponentDef<ThemeServiceStruct> = {
        props: initialTheme,
        msgBroker: {
            subscribe: {
                'APP.THEME.CHANGED': {
                    in: {
                        callback: (msg) => {
                            if (msg.payload) {
                                c.model.preference = msg.payload.preference;
                                c.model.mode = msg.payload.mode;
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

export const ThemeService = toReact(useThemeService);

