import { describe, it, expect, beforeEach } from 'vitest';
import {
    createI18nRuntime,
    registerResources,
    t,
    translate,
    pseudoLocalize,
} from '@/i18n/i18nRuntime';

describe('i18nRuntime', () => {
    beforeEach(() => {
        createI18nRuntime({
            supportedLocales: ['en', 'ru', 'en-XA'],
            fallbackLocale: 'en',
            enablePseudo: true,
            pseudoLocale: 'en-XA',
        });

        registerResources('en', 'test', {
            greeting: 'Hello {{name}}!',
            files_one: '{{count}} file',
            files_other: '{{count}} files',
            fallbackOnly: 'Only in English',
        });

        registerResources('ru', 'test', {
            greeting: 'Привет, {{name}}!',
            files_one: '{{count}} файл',
            files_few: '{{count}} файла',
            files_many: '{{count}} файлов',
        });
    });

    it('interpolates parameters correctly', () => {
        expect(t('test:greeting', { name: 'Alice' })).toBe('Hello Alice!');
    });

    it('supports Russian plural forms: 1, 2, 5, 21', async () => {
        const inst = (await import('@/i18n/i18nRuntime')).getI18nInstance();
        await inst.changeLanguage('ru');

        expect(t('test:files', { count: 1 })).toBe('1 файл');
        expect(t('test:files', { count: 2 })).toBe('2 файла');
        expect(t('test:files', { count: 5 })).toBe('5 файлов');
        expect(t('test:files', { count: 21 })).toBe('21 файл');
    });

    it('falls back to English when a key is missing in Russian', async () => {
        const inst = (await import('@/i18n/i18nRuntime')).getI18nInstance();
        await inst.changeLanguage('ru');

        expect(t('test:fallbackOnly')).toBe('Only in English');
    });

    it('translates MessageDescriptor and uses fallback when key is missing', () => {
        expect(
            translate({
                key: 'test:greeting',
                params: { name: 'Bob' },
            }),
        ).toBe('Hello Bob!');

        expect(
            translate({
                key: 'test:nonexistent_key',
                fallback: 'Custom Fallback',
            }),
        ).toBe('Custom Fallback');
    });

    it('transforms strings with pseudo-localization while preserving variables', () => {
        const source = 'Hello {{name}}!';
        const pseudo = pseudoLocalize(source);

        expect(pseudo.startsWith('[!!! ')).toBe(true);
        expect(pseudo.endsWith(' !!!]')).toBe(true);
        expect(pseudo).toContain('{{name}}');
        expect(pseudo).not.toBe(source);
    });
});
