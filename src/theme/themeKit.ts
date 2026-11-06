import type { clsx } from 'clsx';
import { themeTokens, themeCssVars } from './theme.generated.ts';
import { createMergeClasses, tw as coreTw, mergeClasses as coreMergeClasses } from './tw.ts';
import type { TwArg, ValidateArgs, TwClasses } from './tw.ts';
import { createThemeVar, themeVar as coreThemeVar } from './themeVar.ts';
import type { ThemeVarFn } from './themeVar.ts';
import { createThemeRuntime, themeRuntime as coreThemeRuntime } from './themeRuntime.ts';
import type { ThemeRuntimeContract } from './themeRuntime.ts';

export type ThemeScaleKey = keyof typeof themeTokens;

export interface TokenLike {
    var: string;
    value: string;
    modes?: Record<string, string>;
    props?: Record<string, string>;
}

export type ThemeTokenSet = {
    readonly [S in ThemeScaleKey]: Readonly<Record<string, TokenLike>>;
};

export type ThemeScaleNames = {
    readonly [S in ThemeScaleKey]: string;
};

export type MergeTokens<A extends ThemeTokenSet, B extends Partial<ThemeTokenSet>> = {
    readonly [S in ThemeScaleKey]: A[S] & (B[S] extends object ? B[S] : {});
};

export type ScaleNames<T extends ThemeTokenSet> = {
    readonly [S in ThemeScaleKey]: keyof T[S] & string;
};

export interface ThemeKit<T extends ThemeTokenSet> {
    readonly tokens: T;
    readonly vars: { readonly [S in ThemeScaleKey]: { readonly [N in keyof T[S]]: string } };
    tw<const A extends readonly TwArg[]>(...classes: ValidateArgs<A, ScaleNames<T>>): TwClasses;
    mergeClasses(...inputs: Parameters<typeof clsx>): string;
    themeVar: ThemeVarFn<T>;
    themeRuntime: ThemeRuntimeContract<T>;
}

export function createThemeKit<E extends Partial<ThemeTokenSet> = {}>(
    extension?: E,
): ThemeKit<MergeTokens<typeof themeTokens, E>> {
    const scales = Object.keys(themeTokens) as ThemeScaleKey[];
    const hasExtension = Boolean(extension && Object.keys(extension).length > 0);

    if (!hasExtension) {
        return {
            tokens: themeTokens as MergeTokens<typeof themeTokens, E>,
            vars: themeCssVars as any,
            tw: coreTw as unknown as ThemeKit<MergeTokens<typeof themeTokens, E>>['tw'],
            mergeClasses: coreMergeClasses,
            themeVar: coreThemeVar as unknown as ThemeKit<MergeTokens<typeof themeTokens, E>>['themeVar'],
            themeRuntime: coreThemeRuntime as unknown as ThemeKit<MergeTokens<typeof themeTokens, E>>['themeRuntime'],
        };
    }

    const mergedTokens = {} as Record<ThemeScaleKey, Record<string, TokenLike>>;
    const vars = {} as Record<ThemeScaleKey, Record<string, string>>;
    for (const scale of scales) {
        const coreScale = themeTokens[scale] as Record<string, TokenLike>;
        const extScale = (extension?.[scale] || {}) as Record<string, TokenLike>;
        mergedTokens[scale] = { ...coreScale, ...extScale };

        vars[scale] = {};
        for (const [name, token] of Object.entries(mergedTokens[scale])) {
            vars[scale][name] = token.var;
        }
    }

    const mergeClasses = createMergeClasses(mergedTokens);
    const themeVar = createThemeVar(mergedTokens as unknown as MergeTokens<typeof themeTokens, E>);
    const themeRuntime = createThemeRuntime(mergedTokens as unknown as MergeTokens<typeof themeTokens, E>, vars);

    function tw<const A extends readonly TwArg[]>(
        ...classes: ValidateArgs<A, ScaleNames<MergeTokens<typeof themeTokens, E>>>
    ): TwClasses {
        return mergeClasses(...(classes as unknown as TwArg[])) as TwClasses;
    }

    return {
        tokens: mergedTokens as MergeTokens<typeof themeTokens, E>,
        vars: vars as any,
        tw,
        mergeClasses,
        themeVar,
        themeRuntime,
    };
}

export const defaultThemeKit = createThemeKit();
