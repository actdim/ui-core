import { type LocaleCode, type LocaleDirection, type LocalePreference } from './i18nTypes';

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'syr', 'dv']);

export function resolveDirection(locale: LocaleCode): LocaleDirection {
    if (!locale) {
        return 'ltr';
    }

    const baseLang = locale.trim().toLowerCase().split('-')[0];

    return RTL_LANGUAGES.has(baseLang) ? 'rtl' : 'ltr';
}

export function negotiateLocale(
    candidates: readonly (string | undefined | null)[] | string | undefined | null,
    supported: readonly LocaleCode[],
    fallback: LocaleCode,
): LocaleCode {
    if (!supported || supported.length === 0) {
        return fallback;
    }

    const candidateList = Array.isArray(candidates)
        ? candidates
        : candidates !== undefined && candidates !== null
          ? [candidates]
          : [];

    for (const rawCandidate of candidateList) {
        if (!rawCandidate || typeof rawCandidate !== 'string') {
            continue;
        }

        const candidate = rawCandidate.trim();
        if (!candidate) {
            continue;
        }

        // 1. Exact match (case-insensitive)
        const exactMatch = supported.find(
            (s) => s.toLowerCase() === candidate.toLowerCase(),
        );
        if (exactMatch) {
            return exactMatch;
        }

        // 2. Base language match (e.g. 'ru-RU' -> 'ru')
        const baseCandidate = candidate.split('-')[0].toLowerCase();
        const baseMatch = supported.find(
            (s) => s.toLowerCase() === baseCandidate,
        );
        if (baseMatch) {
            return baseMatch;
        }

        // 3. Prefix match if candidate is base and supported has regional tags (e.g. 'en' -> 'en-US')
        const prefixMatch = supported.find(
            (s) => s.toLowerCase().startsWith(`${baseCandidate}-`),
        );
        if (prefixMatch) {
            return prefixMatch;
        }
    }

    return fallback;
}

export type LocaleEnvironment = {
    stored?: LocalePreference | null;
    host?: LocaleCode | null;
    navigator?: readonly string[] | string | null;
};

export function resolveLocale(
    preference: LocalePreference | undefined | null,
    env: LocaleEnvironment = {},
    supported: readonly LocaleCode[],
    fallback: LocaleCode,
): LocaleCode {
    // 1. Explicit preference (if not 'system' and not falsy)
    if (preference && preference !== 'system') {
        const matched = negotiateLocale([preference], supported, fallback);
        if (matched) {
            return matched;
        }
    }

    // 2. Stored preference from localStorage
    if (env.stored && env.stored !== 'system') {
        const matched = negotiateLocale([env.stored], supported, fallback);
        if (matched) {
            return matched;
        }
    }

    // 3. Host shell locale (e.g. MAUI native host)
    if (env.host) {
        const matched = negotiateLocale([env.host], supported, fallback);
        if (matched) {
            return matched;
        }
    }

    // 4. Browser navigator languages
    const navigatorLangs: readonly string[] = Array.isArray(env.navigator)
        ? env.navigator
        : typeof env.navigator === 'string'
          ? [env.navigator]
          : typeof navigator !== 'undefined'
            ? navigator.languages || (navigator.language ? [navigator.language] : [])
            : [];

    if (navigatorLangs.length > 0) {
        const matched = negotiateLocale(navigatorLangs, supported, fallback);
        if (matched) {
            return matched;
        }
    }

    // 5. Fallback locale
    return fallback;
}
