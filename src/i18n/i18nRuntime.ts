import i18next, { type i18n as I18nInstance } from 'i18next';
import {
    type LocaleCode,
    type MessageDescriptor,
    type I18nServiceOptions,
} from './i18nTypes';

let runtimeInstance: I18nInstance | null = null;
let activeOptions: I18nServiceOptions | null = null;
const registeredNamespaces = new Set<string>(['translation', 'ui-core']);
const listeners = new Set<() => void>();

function notifySubscribers(): void {
    for (const listener of listeners) {
        try {
            listener();
        } catch (err) {
            console.error('Error in i18n change listener:', err);
        }
    }
}

export function subscribeToRuntime(callback: () => void): () => void {
    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
}

const ACCENT_MAP: Record<string, string> = {
    a: 'à', b: 'ƀ', c: 'ç', d: 'đ', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'î', j: 'ĵ',
    k: 'ќ', l: 'ł', m: 'ɱ', n: 'ñ', o: 'ô', p: 'þ', q: 'q', r: 'ŕ', s: 'š', t: 'ţ',
    u: 'û', v: 'ṽ', w: 'ŵ', x: 'x', y: 'ý', z: 'ž',
    A: 'À', B: 'Ɓ', C: 'Ç', D: 'Đ', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Î', J: 'Ĵ',
    K: 'Ќ', L: 'Ł', M: 'Ṁ', N: 'Ñ', O: 'Ô', P: 'Þ', Q: 'Q', R: 'Ŕ', S: 'Š', T: 'Ţ',
    U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'X', Y: 'Ý', Z: 'Ž',
};

export function pseudoLocalize(text: string): string {
    if (!text || typeof text !== 'string') {
        return text;
    }

    const parts = text.split(/(\{\{[^}]+\}\}|<[^>]+>)/g);
    const transformedParts = parts.map((part) => {
        if (part.startsWith('{{') || part.startsWith('<')) {
            return part;
        }

        let transformed = '';
        for (const char of part) {
            transformed += ACCENT_MAP[char] ?? char;
        }

        return transformed;
    });

    return `[!!! ${transformedParts.join('')} !!!]`;
}

export function registerResources(
    locale: LocaleCode,
    ns: string,
    data: Record<string, unknown>,
): void {
    const inst = getI18nInstance();
    inst.addResourceBundle(locale, ns, data, true, true);
    registeredNamespaces.add(ns);
}

export async function ensureNamespaces(
    namespaces: readonly string[] | string,
    targetLocale?: LocaleCode,
): Promise<void> {
    const inst = getI18nInstance();
    const locale = targetLocale || inst.language || activeOptions?.fallbackLocale || 'en';
    const nsList = Array.isArray(namespaces) ? namespaces : [namespaces];

    const missing = nsList.filter((ns) => !inst.hasResourceBundle(locale, ns));
    if (missing.length === 0) {
        return;
    }

    if (activeOptions?.loadNamespace) {
        await Promise.all(
            missing.map(async (ns) => {
                try {
                    const data = await activeOptions!.loadNamespace!(locale, ns);
                    if (data && typeof data === 'object') {
                        registerResources(locale, ns, data);
                    }
                } catch (err) {
                    console.error(`Failed to load namespace "${ns}" for locale "${locale}":`, err);
                }
            }),
        );
    }
}

export function createI18nRuntime(options: I18nServiceOptions): I18nInstance {
    activeOptions = options;
    const inst = i18next.createInstance();

    const supportedLngs = [...options.supportedLocales];
    if (options.enablePseudo && options.pseudoLocale && !supportedLngs.includes(options.pseudoLocale)) {
        supportedLngs.push(options.pseudoLocale);
    }

    inst.init({
        lng: options.fallbackLocale,
        fallbackLng: options.fallbackLocale,
        supportedLngs,
        defaultNS: 'translation',
        fallbackNS: 'ui-core',
        interpolation: {
            escapeValue: false,
        },
        returnNull: false,
        returnEmptyString: false,
    });

    runtimeInstance = inst;

    inst.on('languageChanged', () => {
        notifySubscribers();
    });

    inst.on('loaded', () => {
        notifySubscribers();
    });

    return inst;
}

export function getI18nInstance(): I18nInstance {
    if (!runtimeInstance) {
        runtimeInstance = i18next.createInstance();
        runtimeInstance.init({
            lng: 'en',
            fallbackLng: 'en',
            defaultNS: 'translation',
            interpolation: {
                escapeValue: false,
            },
        });
    }

    return runtimeInstance;
}

export function t(key: string, params?: Record<string, unknown>): string {
    const inst = getI18nInstance();
    if (!key) {
        return '';
    }

    let targetKey = key;
    let targetNs = params?.ns as string | undefined;

    // Support dot-notation where first segment matches a registered namespace (e.g. 'ui-core.dialog.close')
    if (!targetNs && !targetKey.includes(':')) {
        const dotIndex = targetKey.indexOf('.');
        if (dotIndex > 0) {
            const potentialNs = targetKey.slice(0, dotIndex);
            if (registeredNamespaces.has(potentialNs)) {
                targetNs = potentialNs;
                targetKey = targetKey.slice(dotIndex + 1);
            }
        }
    }

    const options: Record<string, unknown> = { ...(params || {}) };
    if (targetNs) {
        options.ns = targetNs;
    }

    let result = inst.t(targetKey, options);

    // If result is empty or equals the key and fallback is provided
    if (typeof result !== 'string') {
        result = String(result ?? '');
    }

    // Pseudo-localization if active
    const isPseudo =
        activeOptions?.enablePseudo &&
        activeOptions?.pseudoLocale &&
        inst.language === activeOptions.pseudoLocale;

    if (isPseudo) {
        return pseudoLocalize(result);
    }

    return result;
}

export function translate(descriptor: MessageDescriptor): string {
    if (!descriptor || !descriptor.key) {
        return '';
    }

    const translated = t(descriptor.key, descriptor.params);

    // For dot-namespaced keys ('library.errors.x') t() resolves the namespace, so a missing key comes back
    // without it ('errors.x').
    const dotIndex = descriptor.key.indexOf('.');
    const keyWithoutDotNs =
        !descriptor.key.includes(':') && dotIndex > 0 && registeredNamespaces.has(descriptor.key.slice(0, dotIndex))
            ? descriptor.key.slice(dotIndex + 1)
            : undefined;

    // If key not found (returns key itself) and fallback provided
    if (
        (translated === descriptor.key ||
            translated === keyWithoutDotNs ||
            translated === descriptor.key.split('.').pop() ||
            translated === descriptor.key.split(':').pop()) &&
        descriptor.fallback
    ) {
        return descriptor.fallback;
    }

    return translated;
}
