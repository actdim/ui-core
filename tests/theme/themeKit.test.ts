import { describe, expect, it } from 'vitest';
import { createThemeKit } from '@/theme/themeKit';

const createMockElement = () => {
    const properties = new Map<string, string>();
    return {
        style: {
            setProperty: (name: string, value: string) => {
                properties.set(name, value);
            },
            getPropertyValue: (name: string) => {
                return properties.get(name) ?? '';
            },
            removeProperty: (name: string) => {
                properties.delete(name);
            },
        },
    } as unknown as HTMLElement;
};

describe('themeKit', () => {
    it('merges core and extension tokens correctly', () => {
        const fixtureAppTokens = {
            color: {
                'fixture-app': {
                    var: '--color-fixture-app',
                    value: '#111111',
                    modes: { dark: '#eeeeee' },
                },
            },
            spacing: {
                'fixture-gap': {
                    var: '--spacing-fixture-gap',
                    value: '1.5rem',
                },
            },
        } as const;

        const kit = createThemeKit(fixtureAppTokens);

        // Assert extension tokens present with modes
        expect(kit.tokens.color['fixture-app'].modes?.dark).toBe('#eeeeee');
        expect(kit.tokens.spacing['fixture-gap'].value).toBe('1.5rem');
        expect(kit.vars.color['fixture-app']).toBe('--color-fixture-app');
        expect(kit.vars.spacing['fixture-gap']).toBe('--spacing-fixture-gap');

        // Assert core tokens preserved
        expect(kit.tokens.color['surface-panel'].value).toBe('#ffffff');
        expect(kit.vars.color['surface-panel']).toBe('--color-surface-panel');

        // Assert mergeClasses works with extension classes
        expect(kit.mergeClasses('p-normal', 'p-fixture-gap')).toBe('p-fixture-gap');

        // Assert themeRuntime set/get/reset with mock element
        const mockEl = createMockElement();
        kit.themeRuntime.set('color', 'fixture-app', '#ff0000', mockEl);
        expect(mockEl.style.getPropertyValue('--color-fixture-app')).toBe('#ff0000');

        // Without window.getComputedStyle in Node, get() falls back to token value or computed
        expect(kit.themeRuntime.get('color', 'fixture-app', mockEl)).toBe('#111111');

        // Mock window.getComputedStyle for computed testing
        const originalWindow = globalThis.window;
        try {
            (globalThis as any).window = {
                getComputedStyle: (el: any) => el.style,
            };
            expect(kit.themeRuntime.get('color', 'fixture-app', mockEl)).toBe('#ff0000');
        } finally {
            (globalThis as any).window = originalWindow;
        }

        kit.themeRuntime.reset('color', 'fixture-app', mockEl);
        expect(mockEl.style.getPropertyValue('--color-fixture-app')).toBe('');

        // tw() returns validated classes
        const classes = kit.tw('p-fixture-gap bg-fixture-app');
        expect(classes).toBe('p-fixture-gap bg-fixture-app');
    });
});
