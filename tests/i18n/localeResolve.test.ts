import { describe, it, expect } from 'vitest';
import {
    negotiateLocale,
    resolveLocale,
    resolveDirection,
} from '@/i18n/localeResolve';

describe('localeResolve', () => {
    const supported = ['en', 'ru'] as const;
    const fallback = 'en';

    describe('negotiateLocale', () => {
        it('matches exact supported locales', () => {
            expect(negotiateLocale('en', supported, fallback)).toBe('en');
            expect(negotiateLocale('ru', supported, fallback)).toBe('ru');
        });

        it('handles case-insensitivity', () => {
            expect(negotiateLocale('EN', supported, fallback)).toBe('en');
            expect(negotiateLocale('RU', supported, fallback)).toBe('ru');
        });

        it('resolves regional sub-tags to base language', () => {
            expect(negotiateLocale('ru-RU', supported, fallback)).toBe('ru');
            expect(negotiateLocale('en-GB', supported, fallback)).toBe('en');
            expect(negotiateLocale('en-US', supported, fallback)).toBe('en');
        });

        it('falls back when candidate is unsupported', () => {
            expect(negotiateLocale('de-DE', supported, fallback)).toBe('en');
            expect(negotiateLocale('fr', supported, fallback)).toBe('en');
            expect(negotiateLocale('zh-CN', supported, fallback)).toBe('en');
        });

        it('falls back on empty or null candidates', () => {
            expect(negotiateLocale('', supported, fallback)).toBe('en');
            expect(negotiateLocale(null, supported, fallback)).toBe('en');
            expect(negotiateLocale(undefined, supported, fallback)).toBe('en');
            expect(negotiateLocale([], supported, fallback)).toBe('en');
        });

        it('evaluates candidates in array order until first match', () => {
            expect(negotiateLocale(['fr', 'ru-RU', 'en'], supported, fallback)).toBe('ru');
            expect(negotiateLocale(['it', 'en-US'], supported, fallback)).toBe('en');
        });
    });

    describe('resolveLocale resolution order', () => {
        it('prioritizes explicit user preference over stored, host, and navigator', () => {
            const result = resolveLocale(
                'ru',
                {
                    stored: 'en',
                    host: 'en',
                    navigator: ['en-US'],
                },
                supported,
                fallback,
            );
            expect(result).toBe('ru');
        });

        it('falls back to stored preference when preference is omitted or undefined', () => {
            const result = resolveLocale(
                undefined,
                {
                    stored: 'ru',
                    host: 'en',
                    navigator: ['en-US'],
                },
                supported,
                fallback,
            );
            expect(result).toBe('ru');
        });

        it('falls back to host locale when preference and stored are system or absent', () => {
            const result = resolveLocale(
                'system',
                {
                    stored: 'system',
                    host: 'ru',
                    navigator: ['en-US'],
                },
                supported,
                fallback,
            );
            expect(result).toBe('ru');
        });

        it('falls back to navigator when preference and stored are system and host is absent', () => {
            const result = resolveLocale(
                'system',
                {
                    stored: 'system',
                    host: null,
                    navigator: ['ru-RU', 'en'],
                },
                supported,
                fallback,
            );
            expect(result).toBe('ru');
        });

        it('falls back to default fallback when all candidates are unsupported', () => {
            const result = resolveLocale(
                'system',
                {
                    stored: 'system',
                    host: 'ja',
                    navigator: ['fr-FR'],
                },
                supported,
                'en',
            );
            expect(result).toBe('en');
        });
    });

    describe('resolveDirection', () => {
        it('returns ltr for en and ru', () => {
            expect(resolveDirection('en')).toBe('ltr');
            expect(resolveDirection('ru')).toBe('ltr');
            expect(resolveDirection('en-US')).toBe('ltr');
            expect(resolveDirection('ru-RU')).toBe('ltr');
        });

        it('returns rtl for Arabic, Hebrew, Farsi, and Urdu', () => {
            expect(resolveDirection('ar')).toBe('rtl');
            expect(resolveDirection('ar-EG')).toBe('rtl');
            expect(resolveDirection('he')).toBe('rtl');
            expect(resolveDirection('fa')).toBe('rtl');
            expect(resolveDirection('ur')).toBe('rtl');
        });

        it('defaults to ltr on empty input', () => {
            expect(resolveDirection('')).toBe('ltr');
        });
    });
});
