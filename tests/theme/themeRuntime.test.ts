import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { themeRuntime, themeCssVars } from '@/theme/themeRuntime';
import { themeTokens } from '@/theme/theme.generated';

type MockStyle = {
    setProperty: (name: string, value: string) => void;
    getPropertyValue: (name: string) => string;
    removeProperty: (name: string) => void;
};

type MockElement = {
    style: MockStyle;
};

const createMockElement = (): MockElement => {
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
    };
};

describe('themeRuntime contract', () => {
    let mockElement: MockElement;
    let originalDocument: unknown;
    let originalWindow: unknown;

    beforeEach(() => {
        mockElement = createMockElement();
        originalDocument = (globalThis as Record<string, unknown>).document;
        originalWindow = (globalThis as Record<string, unknown>).window;
    });

    afterEach(() => {
        if (originalDocument === undefined) {
            delete (globalThis as Record<string, unknown>).document;
        } else {
            (globalThis as Record<string, unknown>).document = originalDocument;
        }

        if (originalWindow === undefined) {
            delete (globalThis as Record<string, unknown>).window;
        } else {
            (globalThis as Record<string, unknown>).window = originalWindow;
        }
    });

    it('exposes vars and tokens references', () => {
        expect(themeRuntime.vars).toBe(themeCssVars);
        expect(themeRuntime.tokens).toBe(themeTokens);
    });

    it('sets a CSS custom property on a targeted element', () => {
        themeRuntime.set('spacing', 'normal', '1rem', mockElement as unknown as HTMLElement);
        expect(mockElement.style.getPropertyValue('--spacing-normal')).toBe('1rem');
    });

    it('resets a CSS custom property from a targeted element', () => {
        themeRuntime.set('spacing', 'normal', '1rem', mockElement as unknown as HTMLElement);
        expect(mockElement.style.getPropertyValue('--spacing-normal')).toBe('1rem');

        themeRuntime.reset('spacing', 'normal', mockElement as unknown as HTMLElement);
        expect(mockElement.style.getPropertyValue('--spacing-normal')).toBe('');
    });

    it('applies a batch of CSS custom properties', () => {
        themeRuntime.applyBatch(
            {
                spacing: { normal: '1.25rem', snug: '0.625rem' },
                color: { primary: '#059669' },
            },
            mockElement as unknown as HTMLElement,
        );

        expect(mockElement.style.getPropertyValue('--spacing-normal')).toBe('1.25rem');
        expect(mockElement.style.getPropertyValue('--spacing-snug')).toBe('0.625rem');
        expect(mockElement.style.getPropertyValue('--color-primary')).toBe('#059669');
    });

    it('resets a batch of CSS custom properties', () => {
        themeRuntime.applyBatch(
            {
                spacing: { normal: '1.25rem', snug: '0.625rem' },
                color: { primary: '#059669' },
            },
            mockElement as unknown as HTMLElement,
        );

        themeRuntime.resetBatch(
            {
                spacing: { normal: 'ignored', snug: 'ignored' },
                color: { primary: 'ignored' },
            },
            mockElement as unknown as HTMLElement,
        );

        expect(mockElement.style.getPropertyValue('--spacing-normal')).toBe('');
        expect(mockElement.style.getPropertyValue('--spacing-snug')).toBe('');
        expect(mockElement.style.getPropertyValue('--color-primary')).toBe('');
    });

    it('gets the default value when not running in DOM', () => {
        delete (globalThis as Record<string, unknown>).document;
        delete (globalThis as Record<string, unknown>).window;

        const val = themeRuntime.get('spacing', 'normal');
        expect(val).toBe(themeTokens.spacing.normal.value);
    });

    it('falls back gracefully to document.documentElement when target is omitted', () => {
        (globalThis as Record<string, unknown>).document = {
            documentElement: mockElement,
        };

        themeRuntime.set('color', 'surface-panel', '#ffffff');
        expect(mockElement.style.getPropertyValue('--color-surface-panel')).toBe('#ffffff');

        themeRuntime.reset('color', 'surface-panel');
        expect(mockElement.style.getPropertyValue('--color-surface-panel')).toBe('');
    });
});
