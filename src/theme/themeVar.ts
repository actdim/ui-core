import { themeTokens } from './theme.generated';

export type TokenScale = keyof typeof themeTokens;

export type TokenName<S extends TokenScale> = keyof (typeof themeTokens)[S];

export type ThemeVarFn = {
    <S extends TokenScale>(scale: S, name: TokenName<S>): string;
    raw: <S extends TokenScale>(scale: S, name: TokenName<S>) => string;
};

const getVar = <S extends TokenScale>(scale: S, name: TokenName<S>): string => {
    const group = themeTokens[scale] as Record<string, { var: string }>;
    const entry = group[name as string];

    return `var(${entry.var})`;
};

const getRaw = <S extends TokenScale>(scale: S, name: TokenName<S>): string => {
    const group = themeTokens[scale] as Record<string, { var: string }>;
    const entry = group[name as string];

    return entry.var;
};

/**
 * Returns a CSS var(...) expression referencing the given theme token.
 * Validates the scale and token name at compile time.
 *
 * Example:
 *   themeVar('color', 'surface-inverse') // 'var(--color-surface-inverse)'
 *   themeVar.raw('color', 'primary')     // '--color-primary'
 */
export const themeVar: ThemeVarFn = Object.assign(getVar, {
    raw: getRaw,
});
