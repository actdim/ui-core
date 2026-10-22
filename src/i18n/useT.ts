import { useSyncExternalStore } from 'react';
import { type LocaleInfo } from './i18nTypes';
import { getRuntimeRevision, subscribeToRuntime, t } from './i18nRuntime';
import { getCurrentLocale } from './LocaleService';

export function useLocale(): LocaleInfo {
    return useSyncExternalStore(
        subscribeToRuntime,
        getCurrentLocale,
        getCurrentLocale,
    );
}

export type TFunction = (key: string, params?: Record<string, unknown>) => string;

export function useT(ns?: string): TFunction {
    useSyncExternalStore(subscribeToRuntime, getRuntimeRevision, getRuntimeRevision);

    return (key: string, params?: Record<string, unknown>): string => {
        const options: Record<string, unknown> = { ...(params || {}) };
        if (ns && !options.ns) {
            options.ns = ns;
        }

        return t(key, options);
    };
}

export type TranslationKey<T, Depth extends readonly number[] = []> = Depth['length'] extends 6
    ? string
    : T extends Record<string, any>
      ? {
            [K in keyof T & string]: T[K] extends Record<string, any>
                ? `${K}` | `${K}.${TranslationKey<T[K], [...Depth, 1]>}`
                : `${K}`;
        }[keyof T & string]
      : string;

export function createTypedT<TResources>() {
    return function useTypedT<TNamespace extends keyof TResources & string>(ns: TNamespace) {
        const tFn = useT(ns);
        type NsKeys = TranslationKey<TResources[TNamespace]>;

        return (key: NsKeys, params?: Record<string, unknown>): string => {
            return tFn(key as string, params);
        };
    };
}
