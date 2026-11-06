/*
 * tw() - typed class-list helper for the semantic theme (see ./theme.css).
 *
 *   className={tw('flex gap-snug p-normal bg-surface-panel', isActive && 'bg-surface-selected')}
 *
 * Runtime: clsx + tailwind-merge configured with the theme scales, so conflicting token
 * classes resolve correctly (`p-normal p-relaxed` -> `p-relaxed`).
 *
 * Compile time: every class in a string literal is validated. Classes of GOVERNED utilities
 * (colors, spacing, typography, borders, corners, shadows, layers, motion, opacity) must use
 * theme tokens or an allowed built-in keyword; legacy palette / numeric classes
 * (`text-slate-500`, `p-4`, `rounded-lg`, `text-[10px]`) are type errors:
 *
 *   tw('p-4')  // error: Argument of type '"p-4"' is not assignable to '"Unknown theme class: p-4"'
 *
 * Other utilities (`flex`, `w-full`, `grid-cols-3`, `iconify mdi--x`, ...) pass unchecked.
 * Arguments must be string literals, falsy values or results of other tw() calls; plain `string`
 * values are rejected so that nothing bypasses the check.
 */
import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { themeTokens } from './theme.generated.ts';
import type { ScaleNames, ThemeTokenSet, ThemeScaleNames } from './themeKit.ts';

// ---------------------------------------------------------------------------
// Scale types (derived from the generated tokens)
// ---------------------------------------------------------------------------

type CoreNames = ScaleNames<typeof themeTokens>;

export type ThemeColor = CoreNames['color'];
export type ThemeSpacing = CoreNames['spacing'];
export type ThemeContainer = CoreNames['container'];
export type ThemeText = CoreNames['text'];
export type ThemeFontWeight = CoreNames['fontWeight'];
export type ThemeFont = CoreNames['font'];
export type ThemeBorderWidth = CoreNames['borderWidth'];
export type ThemeRingWidth = CoreNames['ringWidth'];
export type ThemeOutlineWidth = CoreNames['outlineWidth'];
export type ThemeRadius = CoreNames['radius'];
export type ThemeShadow = CoreNames['shadow'];
export type ThemeZIndex = CoreNames['zIndex'];
export type ThemeDuration = CoreNames['duration'];
export type ThemeEase = CoreNames['ease'];
export type ThemeOpacity = CoreNames['opacity'];

/** Intent names, matching the `Intent` contract (each has -strong / -soft / -line / -contrast). */
export type ThemeIntent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';

// ---------------------------------------------------------------------------
// Allowed values per governed utility
// ---------------------------------------------------------------------------

type ColorKeyword = 'transparent' | 'current' | 'inherit' | 'white' | 'black';
type ColorName<N extends ThemeScaleNames> = N['color'] | ColorKeyword;
type ColorValue<N extends ThemeScaleNames> = ColorName<N> | `${ColorName<N>}/${number}`;

// Arbitrary spacing is allowed only when it is computed from theme variables or platform
// insets, e.g. `pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom))]`.
type TokenExpression = `[${string}var(--${string})${string}]` | `[${string}env(${string})${string}]`;
// `safe`: app utilities pt-safe / pb-safe / pl-safe / pr-safe (global.css), device safe-area insets.
type SpacingValue<N extends ThemeScaleNames> = N['spacing'] | '0' | 'px' | 'safe' | TokenExpression;
type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'hidden' | 'none';

type ViewportUnit = 'vh' | 'vw' | 'vmin' | 'vmax' | 'dvh' | 'dvw' | 'svh' | 'svw' | 'lvh' | 'lvw';
type ViewportExpression = `[${string}${ViewportUnit}${string}]`;

type SizeKeyword =
    | 'full' | 'screen' | 'auto' | 'fit' | 'min' | 'max'
    | 'dvh' | 'svh' | 'lvh'
    | 'min-content' | 'max-content' | 'fit-content';

type FractionValue = `${number}/${number}`;

type SizeValue<N extends ThemeScaleNames> =
    | N['spacing']
    | '0'
    | 'px'
    | SizeKeyword
    | FractionValue
    | TokenExpression
    | ViewportExpression;

type MaxWidthValue<N extends ThemeScaleNames> = SizeValue<N> | N['container'] | 'prose';

type TextKeyword =
    | 'left' | 'center' | 'right' | 'justify' | 'start' | 'end'
    | 'wrap' | 'nowrap' | 'balance' | 'pretty'
    | 'ellipsis' | 'clip';

type BgKeyword =
    | 'none' | 'fixed' | 'local' | 'scroll'
    | 'clip-border' | 'clip-padding' | 'clip-content' | 'clip-text'
    | 'origin-border' | 'origin-padding' | 'origin-content'
    | 'auto' | 'cover' | 'contain'
    | 'center' | 'top' | 'bottom' | 'left' | 'right'
    | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'
    | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    | 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y' | 'repeat-round' | 'repeat-space'
    | `linear-to-${'t' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'tl'}`
    | `gradient-to-${'t' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'tl'}`
    | 'radial' | 'conic'
    | `[url(${string})]`;

type RoundedSide = 't' | 'r' | 'b' | 'l' | 'tl' | 'tr' | 'br' | 'bl' | 's' | 'e' | 'ss' | 'se' | 'es' | 'ee';
type BorderSide = 'x' | 'y' | 't' | 'r' | 'b' | 'l' | 's' | 'e';

type PaddingRoot = 'p' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl' | 'ps' | 'pe';
type MarginRoot = 'm' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml' | 'ms' | 'me';

// Utility roots whose names start like a governed root but are not governed.
type FreeRoot =
    | 'border-spacing' | 'ring-offset' | 'outline-offset' | 'text-shadow' | 'bg-blend'
    | 'inset-shadow' | 'drop-shadow' | 'font-stretch' | 'decoration';

// ---------------------------------------------------------------------------
// Class validation
// ---------------------------------------------------------------------------

type Ok = true;

/** Validates a utility without variants and `!`. Returns Ok or false. */
type CheckUtility<U extends string, N extends ThemeScaleNames> =
    U extends `${FreeRoot}` | `${FreeRoot}-${string}` ? Ok
    // spacing
    : U extends `${'gap-x' | 'gap-y'}-${infer V}` ? (V extends SpacingValue<N> ? Ok : false)
    : U extends `gap-${infer V}` ? (V extends SpacingValue<N> ? Ok : false)
    : U extends `${'space-x' | 'space-y'}-${infer V}` ? (V extends SpacingValue<N> | 'reverse' ? Ok : false)
    : U extends `${PaddingRoot}-${infer V}` ? (V extends SpacingValue<N> ? Ok : false)
    : U extends `${MarginRoot}-${infer V}` ? (V extends SpacingValue<N> | 'auto' ? Ok : false)
    // typography
    : U extends `text-${infer V}` ? (V extends N['text'] | ColorValue<N> | TextKeyword ? Ok : false)
    : U extends `font-${infer V}` ? (V extends N['font'] | N['fontWeight'] ? Ok : false)
    // backgrounds and gradient stops
    : U extends `bg-${infer V}` ? (V extends ColorValue<N> | BgKeyword ? Ok : false)
    : U extends `${'from' | 'via' | 'to'}-${infer V}` ? (V extends ColorValue<N> | `${number}%` ? Ok : false)
    : U extends `${'fill' | 'stroke' | 'caret' | 'accent' | 'placeholder'}-${infer V}` ? (V extends ColorValue<N> | 'none' | 'auto' | `${number}` ? Ok : false)
    // borders, dividers, rings, outlines
    : U extends 'border' | `border-${BorderSide}` ? Ok
    : U extends `border-${BorderSide}-${infer V}` ? (V extends N['borderWidth'] | '0' | ColorValue<N> ? Ok : false)
    : U extends `border-${infer V}` ? (V extends N['borderWidth'] | '0' | ColorValue<N> | BorderStyle | 'collapse' | 'separate' ? Ok : false)
    : U extends `divide-${'x' | 'y'}` ? Ok
    : U extends `divide-${'x' | 'y'}-${infer V}` ? (V extends N['borderWidth'] | '0' | 'reverse' ? Ok : false)
    : U extends `divide-${infer V}` ? (V extends ColorValue<N> | BorderStyle ? Ok : false)
    : U extends 'ring' | 'ring-inset' ? Ok
    : U extends `ring-${infer V}` ? (V extends N['ringWidth'] | '0' | ColorValue<N> ? Ok : false)
    : U extends 'outline' ? Ok
    : U extends `outline-${infer V}` ? (V extends N['outlineWidth'] | '0' | ColorValue<N> | BorderStyle ? Ok : false)
    // corners, elevation, layers
    : U extends `rounded-${RoundedSide}-${infer V}` ? (V extends N['radius'] | 'none' | 'full' ? Ok : false)
    : U extends `rounded-${infer V}` ? (V extends N['radius'] | 'none' | 'full' ? Ok : false)
    : U extends 'rounded' | 'shadow' ? false
    : U extends `shadow-${infer V}` ? (V extends N['shadow'] | 'none' | ColorValue<N> ? Ok : false)
    : U extends `z-${infer V}` ? (V extends N['zIndex'] | '0' | 'auto' ? Ok : false)
    // motion, opacity
    : U extends `duration-${infer V}` ? (V extends N['duration'] | '0' ? Ok : false)
    : U extends `ease-${infer V}` ? (V extends N['ease'] | 'linear' ? Ok : false)
    : U extends `opacity-${infer V}` ? (V extends N['opacity'] | '0' | '100' ? Ok : false)
    // object sizes (size, w, h, min-w, min-h, max-h)
    : U extends `${'size' | 'w' | 'h' | 'min-w' | 'min-h' | 'max-h'}-${infer V}` ? (V extends SizeValue<N> ? Ok : false)
    : U extends `max-w-${infer V}` ? (V extends MaxWidthValue<N> ? Ok : false)
    : U extends 'size' | 'w' | 'h' | 'min-w' | 'min-h' | 'max-w' | 'max-h' ? false
    : Ok;

/** Strips variant prefixes (`hover:`, `md:`, `data-[x]:`) and returns the utility part. */
type StripVariants<C extends string> = C extends `${string}:${infer Rest}` ? StripVariants<Rest> : C;

/** Strips the `!` important marker (prefix or suffix) and the negative `-` prefix. */
type StripMarkers<C extends string> =
    C extends `!${infer R}` ? StripMarkers<R>
    : C extends `${infer R}!` ? StripMarkers<R>
    : C extends `-${infer R}` ? StripMarkers<R>
    : C;

type CheckClass<C extends string, N extends ThemeScaleNames> =
    CheckUtility<StripMarkers<StripVariants<C>>, N> extends Ok ? Ok : `Unknown theme class: ${C}`;

/** Validates a space-separated class list; returns Ok or the first error message. */
type CheckList<S extends string, N extends ThemeScaleNames> =
    S extends `${infer Head} ${infer Rest}`
        ? (Head extends '' ? CheckList<Rest, N> : CheckClass<Head, N> extends Ok ? CheckList<Rest, N> : CheckClass<Head, N>)
        : S extends '' ? Ok : CheckClass<S, N>;

// ---------------------------------------------------------------------------
// tw()
// ---------------------------------------------------------------------------

declare const twBrand: unique symbol;

/** A class list produced by tw(): already validated, safe to pass to another tw(). */
export type TwClasses = string & { readonly [twBrand]: true };

export type TwArg = string | false | null | undefined | 0;

export type ValidateArg<A, N extends ThemeScaleNames = CoreNames> =
    A extends TwClasses ? A
    : A extends false | null | undefined | 0 ? A
    : string extends A ? 'tw(): pass string literals or tw() results, not string values'
    : A extends string ? (CheckList<A, N> extends Ok ? A : CheckList<A, N>)
    : never;

export type ValidateArgs<T extends readonly unknown[], N extends ThemeScaleNames = CoreNames> = {
    [K in keyof T]: ValidateArg<T[K], N>;
};

export function createMergeClasses(tokens: Record<string, Record<string, any>>) {
    const twMergeThemed = extendTailwindMerge({
        extend: {
            theme: {
                color: Object.keys(tokens.color || {}),
                spacing: Object.keys(tokens.spacing || {}),
                container: Object.keys(tokens.container || {}),
                text: Object.keys(tokens.text || {}),
                font: Object.keys(tokens.font || {}),
                'font-weight': Object.keys(tokens.fontWeight || {}),
                radius: Object.keys(tokens.radius || {}),
                shadow: Object.keys(tokens.shadow || {}),
                ease: Object.keys(tokens.ease || {}),
            },
            classGroups: {
                'border-w': [{ border: Object.keys(tokens.borderWidth || {}) }],
                'border-w-x': [{ 'border-x': Object.keys(tokens.borderWidth || {}) }],
                'border-w-y': [{ 'border-y': Object.keys(tokens.borderWidth || {}) }],
                'border-w-s': [{ 'border-s': Object.keys(tokens.borderWidth || {}) }],
                'border-w-e': [{ 'border-e': Object.keys(tokens.borderWidth || {}) }],
                'border-w-t': [{ 'border-t': Object.keys(tokens.borderWidth || {}) }],
                'border-w-r': [{ 'border-r': Object.keys(tokens.borderWidth || {}) }],
                'border-w-b': [{ 'border-b': Object.keys(tokens.borderWidth || {}) }],
                'border-w-l': [{ 'border-l': Object.keys(tokens.borderWidth || {}) }],
                'divide-x': [{ 'divide-x': Object.keys(tokens.borderWidth || {}) }],
                'divide-y': [{ 'divide-y': Object.keys(tokens.borderWidth || {}) }],
                'ring-w': [{ ring: Object.keys(tokens.ringWidth || {}) }],
                'outline-w': [{ outline: Object.keys(tokens.outlineWidth || {}) }],
                z: [{ z: Object.keys(tokens.zIndex || {}) }],
                duration: [{ duration: Object.keys(tokens.duration || {}) }],
                opacity: [{ opacity: Object.keys(tokens.opacity || {}) }],
            },
        },
    });

    return (...inputs: Parameters<typeof clsx>): string => twMergeThemed(clsx(inputs));
}

export const mergeClasses = createMergeClasses(themeTokens);

export function tw<const A extends readonly TwArg[]>(...classes: ValidateArgs<A, CoreNames>): TwClasses {
    return mergeClasses(...(classes as unknown as TwArg[])) as TwClasses;
}

export { themeVar, type ThemeVarFn, type TokenName, type TokenScale } from './themeVar.ts';
export { themeRuntime, themeCssVars, type ThemeRuntimeContract, type ThemeOverrideMap } from './themeRuntime.ts';
