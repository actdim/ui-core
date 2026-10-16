import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { generateThemeTokens, parseTheme, renderThemeTokens, themeCssFile, themeGeneratedFile } from '../../postcss';
import { mergeClasses, themeVar, tw } from '@/theme/tw';
import { themeTokens, themeCssVars } from '@/theme/theme.generated';

const fixtureCss = `
@theme static {
    /* comment */
    --color-surface-panel: #ffffff;
    --spacing-normal: 0.75rem;
    --text-title: 1.125rem;
    --text-title--line-height: 1.75rem;
    --font-weight-strong: 600;
    --font-ui: system-ui, sans-serif;
}
@utility focus-ring { outline: 2px solid red; }
@custom-variant compact (&:where([data-tier="compact"] *));
@layer base {
    .dark { --color-surface-panel: #0f172a; }
    [data-tier="compact"] { --spacing-normal: 0.5rem; }
}
`;

describe('theme token generator', () => {
    it('parses scales, sub-properties, mode overrides, utilities and variants', () => {
        const theme = parseTheme(fixtureCss);
        expect(theme.tokens.color['surface-panel']).toEqual({
            var: '--color-surface-panel',
            value: '#ffffff',
            modes: { dark: '#0f172a' },
            props: {},
        });
        expect(theme.tokens.spacing.normal.modes).toEqual({ compact: '0.5rem' });
        expect(theme.tokens.text.title.props).toEqual({ 'line-height': '1.75rem' });
        expect(theme.tokens.fontWeight.strong.value).toBe('600');
        expect(theme.tokens.font.ui.value).toBe('system-ui, sans-serif');
        expect(theme.utilities).toEqual(['focus-ring']);
        expect(theme.variants).toEqual(['compact']);
    });

    it('rejects an override of an unknown token', () => {
        expect(() => parseTheme('@theme static { --spacing-a: 1px; } .dark { --spacing-b: 2px; }')).toThrow(/unknown token/);
    });

    it('writes only when the output changes', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-tokens-'));
        const cssFile = path.join(dir, 'theme.css');
        const outFile = path.join(dir, 'theme.generated.ts');
        fs.writeFileSync(cssFile, fixtureCss, 'utf8');
        try {
            expect(generateThemeTokens(cssFile, outFile)).toBe(true);
            expect(generateThemeTokens(cssFile, outFile)).toBe(false);
            expect(fs.readFileSync(outFile, 'utf8')).toContain("'surface-panel': { var: '--color-surface-panel'");
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('matches the committed theme.generated.ts', () => {
        const current = fs.readFileSync(themeGeneratedFile, 'utf8');
        const fresh = renderThemeTokens(fs.readFileSync(themeCssFile, 'utf8'));
        expect(fresh).toBe(current);
    });
});

describe('tw() and mergeClasses()', () => {
    it('resolves conflicting token classes using the last one', () => {
        expect(mergeClasses('p-normal p-relaxed')).toBe('p-relaxed');
        expect(mergeClasses('bg-surface-panel bg-surface-hover')).toBe('bg-surface-hover');
        expect(mergeClasses('text-fg-default text-fg-muted')).toBe('text-fg-muted');
        expect(mergeClasses('rounded-control rounded-panel')).toBe('rounded-panel');
        expect(mergeClasses('shadow-panel shadow-popup')).toBe('shadow-popup');
        expect(mergeClasses('duration-short duration-long')).toBe('duration-long');
    });

    it('preserves non-conflicting token and utility classes', () => {
        expect(tw('flex items-center gap-snug p-normal bg-surface-panel text-fg-muted')).toBe(
            'flex items-center gap-snug p-normal bg-surface-panel text-fg-muted',
        );
    });

    it('handles falsy values and conditional branches', () => {
        const condition = false;
        expect(tw('flex', condition && 'p-normal', null, undefined)).toBe('flex');
    });

    it('accepts results of nested tw() calls without losing validity', () => {
        const base = tw('p-normal text-fg-muted');
        expect(tw(base, 'bg-surface-panel')).toBe('p-normal text-fg-muted bg-surface-panel');
    });
});

describe('themeVar helper', () => {
    it('formats var(--...) expressions for tokens', () => {
        expect(themeVar('color', 'surface-panel')).toBe('var(--color-surface-panel)');
        expect(themeVar('spacing', 'normal')).toBe('var(--spacing-normal)');
        expect(themeVar('radius', 'control')).toBe('var(--radius-control)');
    });

    it('returns raw variable names via themeVar.raw', () => {
        expect(themeVar.raw('color', 'surface-panel')).toBe('--color-surface-panel');
        expect(themeVar.raw('spacing', 'normal')).toBe('--spacing-normal');
    });
});
