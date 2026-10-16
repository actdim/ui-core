/*
 * Compile-time tests for tw() class validation. Checked by `tsc -b`; never imported at runtime.
 * Every `@ts-expect-error` line must stay an error: if a legacy class becomes accepted, tsc fails
 * with "Unused '@ts-expect-error' directive".
 */
import { tw, type TwClasses } from './tw';

declare const flag: boolean;
declare const someString: string;

// --- accepted -------------------------------------------------------------
export const accepted: TwClasses[] = [
    tw('flex items-center gap-snug p-normal bg-surface-panel text-fg-muted'),
    tw('hover:bg-surface-hover focus-visible:focus-ring compact:hidden md:p-relaxed'),
    tw('border border-line-default border-b-thick border-t-0 rounded-panel shadow-popup'),
    tw('text-title text-body text-caption text-micro font-emphasis font-code'),
    tw('bg-danger-soft text-danger-strong border-danger-line hover:bg-primary-strong'),
    tw('bg-primary/20 text-white bg-black/50 bg-transparent text-current'),
    tw('z-dialog duration-short ease-enter opacity-disabled ring-thick outline-none'),
    tw('h-control-md size-icon-sm min-h-touch w-sidebar max-w-dialog-md max-w-prose'),
    tw('size-control-xs w-cover-sm sm:w-cover-md min-h-[60vh] min-h-[100dvh] w-1/2 min-w-0 min-h-0 w-px'),
    tw('-mt-px mx-auto p-0 space-y-tight divide-y divide-line-muted text-center truncate'),
    tw('iconify mdi--folder w-full h-full grid grid-cols-3 ring-offset-2 data-[state=open]:p-normal'),
    tw('flex', flag && 'p-normal', flag ? 'text-fg-muted' : 'text-fg-faint', null, undefined),
    tw(tw('p-normal'), 'gap-snug'),
];

// --- rejected -------------------------------------------------------------
// @ts-expect-error legacy numeric spacing
tw('p-4');
// @ts-expect-error legacy palette color
tw('flex text-slate-500');
// @ts-expect-error legacy palette color inside a variant
tw('hover:bg-blue-50');
// @ts-expect-error built-in size name instead of a text style
tw('text-sm');
// @ts-expect-error arbitrary value in a governed utility
tw('text-[10px]');
// @ts-expect-error built-in radius name
tw('rounded-lg');
// @ts-expect-error bare rounded has no token meaning
tw('rounded');
// @ts-expect-error numeric z-index
tw('z-50');
// @ts-expect-error typo in a token
tw('bg-surface-panle');
// @ts-expect-error built-in font weight
tw('font-semibold');
// @ts-expect-error dark: pairs are not needed: tokens switch in .dark
tw('dark:bg-slate-900');
// @ts-expect-error invalid class in a conditional branch
tw('flex', flag ? 'p-normal' : 'p-3');
// @ts-expect-error numeric width
tw('w-4');
// @ts-expect-error numeric width
tw('w-9');
// @ts-expect-error numeric height
tw('h-8');
// @ts-expect-error numeric size
tw('size-5');
// @ts-expect-error arbitrary pixel size in min-w
tw('min-w-[24px]');
// @ts-expect-error arbitrary pixel size in min-h
tw('min-h-[40px]');
// @ts-expect-error arbitrary pixel size in max-w
tw('max-w-[200px]');
// @ts-expect-error legacy numeric max-h
tw('max-h-72');
// @ts-expect-error legacy built-in max-w container size
tw('max-w-sm');
// @ts-expect-error plain string values bypass validation
tw(someString);
