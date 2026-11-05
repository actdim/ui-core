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

/** i18next plural suffixes (`Intl.PluralRules` categories). */
export type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/** `items_one` -> `items`; `never` for keys without a plural suffix. */
export type PluralBase<K extends string, S extends PluralSuffix = PluralSuffix> = S extends PluralSuffix
    ? K extends `${infer B}_${S}`
        ? B
        : never
    : never;

export type TranslationKey<T, Depth extends readonly number[] = []> = Depth['length'] extends 6
    ? string
    : T extends Record<string, any>
      ? {
            [K in keyof T & string]: T[K] extends Record<string, any>
                ? `${K}` | `${K}.${TranslationKey<T[K], [...Depth, 1]>}`
                : `${K}` | PluralBase<K>;
        }[keyof T & string]
      : string;

/** Key-typed translate function of one namespace. Name it in props and helpers instead of `TFunction`. */
export type TypedT<TResources, TNamespace extends keyof TResources & string> = (
    key: TranslationKey<TResources[TNamespace]>,
    params?: Record<string, unknown>,
) => string;

/** Hook returned by `createTypedT`. */
export type UseTypedT<TResources> = <TNamespace extends keyof TResources & string>(
    ns: TNamespace,
) => TypedT<TResources, TNamespace>;

export function createTypedT<TResources>(): UseTypedT<TResources> {
    return function useTypedT<TNamespace extends keyof TResources & string>(
        ns: TNamespace,
    ): TypedT<TResources, TNamespace> {
        const tFn = useT(ns);

        return (key, params) => {
            return tFn(key as string, params);
        };
    };
}
