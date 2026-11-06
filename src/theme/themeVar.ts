import { themeTokens } from './theme.generated.ts';
import type { ThemeScaleKey, ThemeTokenSet } from './themeKit.ts';

export type TokenScale = ThemeScaleKey;

export type TokenName<S extends ThemeScaleKey, T extends ThemeTokenSet = typeof themeTokens> = keyof T[S] & string;

export type ThemeVarFn<T extends ThemeTokenSet = typeof themeTokens> = {
    <S extends ThemeScaleKey>(scale: S, name: TokenName<S, T>): string;
    raw: <S extends ThemeScaleKey>(scale: S, name: TokenName<S, T>) => string;
};

export function createThemeVar<T extends ThemeTokenSet>(tokens: T): ThemeVarFn<T> {
    const getVar = <S extends ThemeScaleKey>(scale: S, name: TokenName<S, T>): string => {
        const group = tokens[scale] as Record<string, { var: string }>;
        const entry = group[name as string];

        return `var(${entry.var})`;
    };

    const getRaw = <S extends ThemeScaleKey>(scale: S, name: TokenName<S, T>): string => {
        const group = tokens[scale] as Record<string, { var: string }>;
        const entry = group[name as string];

        return entry.var;
    };

    return Object.assign(getVar, {
        raw: getRaw,
    }) as ThemeVarFn<T>;
}

export const themeVar = createThemeVar(themeTokens);
