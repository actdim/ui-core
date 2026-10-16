/*
 * themeRuntime - Typed runtime contract for querying and overriding CSS theme variables.
 *
 * Usage:
 *   // 1. Set global variable on :root (document.documentElement)
 *   themeRuntime.set('spacing', 'normal', '1rem');
 *
 *   // 2. Set variable scoped to a specific element container
 *   themeRuntime.set('color', 'surface-panel', '#f3f4f6', dialogElement);
 *
 *   // 3. Get computed or default value
 *   const normalSpacing = themeRuntime.get('spacing', 'normal');
 *
 *   // 4. Batch apply / reset
 *   themeRuntime.applyBatch({
 *       spacing: { normal: '1rem', snug: '0.625rem' },
 *       color: { primary: '#059669' },
 *   });
 *   themeRuntime.reset('spacing', 'normal');
 */
import { themeTokens, themeCssVars } from './theme.generated';
import { type TokenScale, type TokenName } from './themeVar';

export type ThemeOverrideMap = {
    [S in TokenScale]?: {
        [N in TokenName<S>]?: string;
    };
};

export type ThemeRuntimeContract = {
    readonly vars: typeof themeCssVars;
    readonly tokens: typeof themeTokens;
    set: <S extends TokenScale>(scale: S, name: TokenName<S>, value: string, target?: HTMLElement | null) => void;
    get: <S extends TokenScale>(scale: S, name: TokenName<S>, target?: HTMLElement | null) => string;
    reset: <S extends TokenScale>(scale: S, name: TokenName<S>, target?: HTMLElement | null) => void;
    applyBatch: (overrides: ThemeOverrideMap, target?: HTMLElement | null) => void;
    resetBatch: (overrides: ThemeOverrideMap, target?: HTMLElement | null) => void;
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

const setVar = <S extends TokenScale>(
    scale: S,
    name: TokenName<S>,
    value: string,
    target?: HTMLElement | null,
): void => {
    const el = getTargetElement(target);
    if (!el) {
        return;
    }
    const varName = (themeCssVars[scale] as Record<string, string>)[name as string];
    if (varName) {
        el.style.setProperty(varName, value);
    }
};

const getVar = <S extends TokenScale>(
    scale: S,
    name: TokenName<S>,
    target?: HTMLElement | null,
): string => {
    const defaultToken = (themeTokens[scale] as Record<string, { var: string; value: string }>)[name as string];
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

const resetVar = <S extends TokenScale>(
    scale: S,
    name: TokenName<S>,
    target?: HTMLElement | null,
): void => {
    const el = getTargetElement(target);
    if (!el) {
        return;
    }
    const varName = (themeCssVars[scale] as Record<string, string>)[name as string];
    if (varName) {
        el.style.removeProperty(varName);
    }
};

const applyBatch = (
    overrides: ThemeOverrideMap,
    target?: HTMLElement | null,
): void => {
    const el = getTargetElement(target);
    if (!el) {
        return;
    }

    for (const [scale, entries] of Object.entries(overrides) as [TokenScale, Record<string, string>][]) {
        for (const [name, value] of Object.entries(entries)) {
            if (value !== undefined) {
                setVar(scale, name as TokenName<typeof scale>, value, el);
            }
        }
    }
};

const resetBatch = (
    overrides: ThemeOverrideMap,
    target?: HTMLElement | null,
): void => {
    const el = getTargetElement(target);
    if (!el) {
        return;
    }

    for (const [scale, entries] of Object.entries(overrides) as [TokenScale, Record<string, string>][]) {
        for (const name of Object.keys(entries)) {
            resetVar(scale, name as TokenName<typeof scale>, el);
        }
    }
};

export const themeRuntime: ThemeRuntimeContract = {
    vars: themeCssVars,
    tokens: themeTokens,
    set: setVar,
    get: getVar,
    reset: resetVar,
    applyBatch,
    resetBatch,
};

export { themeCssVars };
