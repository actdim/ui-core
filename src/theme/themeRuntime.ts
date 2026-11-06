/*
 * themeRuntime - Typed runtime contract for querying and overriding CSS theme variables.
 */
import { themeTokens, themeCssVars } from './theme.generated.ts';
import type { ThemeScaleKey, ThemeTokenSet } from './themeKit.ts';
import type { TokenName } from './themeVar.ts';

export type ThemeOverrideMap<T extends ThemeTokenSet = typeof themeTokens> = {
    [S in ThemeScaleKey]?: {
        [N in TokenName<S, T>]?: string;
    };
};

export type ThemeRuntimeContract<T extends ThemeTokenSet = typeof themeTokens> = {
    readonly vars: { readonly [S in ThemeScaleKey]: { readonly [N in keyof T[S]]: string } };
    readonly tokens: T;
    set: <S extends ThemeScaleKey>(scale: S, name: TokenName<S, T>, value: string, target?: HTMLElement | null) => void;
    get: <S extends ThemeScaleKey>(scale: S, name: TokenName<S, T>, target?: HTMLElement | null) => string;
    reset: <S extends ThemeScaleKey>(scale: S, name: TokenName<S, T>, target?: HTMLElement | null) => void;
    applyBatch: (overrides: ThemeOverrideMap<T>, target?: HTMLElement | null) => void;
    resetBatch: (overrides: ThemeOverrideMap<T>, target?: HTMLElement | null) => void;
};

const getTargetElement = (target?: HTMLElement | null): HTMLElement | null => {
    if (target) {
        return target;
    }
    if (typeof document !== 'undefined' && document.documentElement) {
        return document.documentElement;
    }

    return null;
};

export function createThemeRuntime<T extends ThemeTokenSet>(
    tokens: T,
    vars: Record<string, Record<string, string>>,
): ThemeRuntimeContract<T> {
    const setVar = <S extends ThemeScaleKey>(
        scale: S,
        name: TokenName<S, T>,
        value: string,
        target?: HTMLElement | null,
    ): void => {
        const el = getTargetElement(target);
        if (!el) {
            return;
        }
        const varName = (vars[scale as string] as Record<string, string>)?.[name as string];
        if (varName) {
            el.style.setProperty(varName, value);
        }
    };

    const getVar = <S extends ThemeScaleKey>(
        scale: S,
        name: TokenName<S, T>,
        target?: HTMLElement | null,
    ): string => {
        const defaultToken = (tokens[scale] as Record<string, { var: string; value: string }>)?.[name as string];
        if (!defaultToken) {
            return '';
        }
        const el = getTargetElement(target);
        if (!el || typeof window === 'undefined' || !window.getComputedStyle) {
            return defaultToken.value;
        }

        const computed = window.getComputedStyle(el).getPropertyValue(defaultToken.var).trim();

        return computed || defaultToken.value;
    };

    const resetVar = <S extends ThemeScaleKey>(
        scale: S,
        name: TokenName<S, T>,
        target?: HTMLElement | null,
    ): void => {
        const el = getTargetElement(target);
        if (!el) {
            return;
        }
        const varName = (vars[scale as string] as Record<string, string>)?.[name as string];
        if (varName) {
            el.style.removeProperty(varName);
        }
    };

    const applyBatch = (
        overrides: ThemeOverrideMap<T>,
        target?: HTMLElement | null,
    ): void => {
        const el = getTargetElement(target);
        if (!el) {
            return;
        }

        for (const [scale, entries] of Object.entries(overrides) as [ThemeScaleKey, Record<string, string>][]) {
            if (!entries) {
                continue;
            }
            for (const [name, value] of Object.entries(entries)) {
                if (value !== undefined) {
                    setVar(scale, name as TokenName<typeof scale, T>, value, el);
                }
            }
        }
    };

    const resetBatch = (
        overrides: ThemeOverrideMap<T>,
        target?: HTMLElement | null,
    ): void => {
        const el = getTargetElement(target);
        if (!el) {
            return;
        }

        for (const [scale, entries] of Object.entries(overrides) as [ThemeScaleKey, Record<string, string>][]) {
            if (!entries) {
                continue;
            }
            for (const name of Object.keys(entries)) {
                resetVar(scale, name as TokenName<typeof scale, T>, el);
            }
        }
    };

    return {
        vars: vars as any,
        tokens,
        set: setVar,
        get: getVar,
        reset: resetVar,
        applyBatch,
        resetBatch,
    };
}

export const themeRuntime = createThemeRuntime(themeTokens, themeCssVars);
export { themeCssVars };
