import { describe, it, expect } from 'vitest';
import {
    formatDate,
    formatDateTime,
    formatNumber,
    formatRelative,
    formatList,
    formatBytes,
    formatDuration,
} from '@/i18n/formatters';

describe('i18n formatters', () => {
    const fixedDate = new Date('2026-10-21T15:30:00.000Z');

    describe('formatDate and formatDateTime', () => {
        it('formats date according to locale', () => {
            const en = formatDate(fixedDate, { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' }, 'en');
            const ru = formatDate(fixedDate, { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' }, 'ru');

            expect(en).toBe('10/21/2026');
            expect(ru).toBe('21.10.2026');
        });

        it('formats datetime according to locale', () => {
            const en = formatDateTime(fixedDate, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
            }, 'en');

            expect(en).toContain('2026');
            expect(en).toContain('30');
        });
    });

    describe('formatNumber', () => {
        it('formats numbers with locale separators', () => {
            const en = formatNumber(1234567.89, undefined, 'en');
            const ru = formatNumber(1234567.89, undefined, 'ru');

            expect(en).toBe('1,234,567.89');
            // Russian uses non-breaking space (or normal space) and comma for decimals
            expect(ru.replace(/\u00a0/g, ' ')).toBe('1 234 567,89');
        });
    });

    describe('formatRelative', () => {
        it('formats relative time', () => {
            const en = formatRelative(-1, 'day', undefined, 'en');
            const ru = formatRelative(-1, 'day', undefined, 'ru');

            expect(en.toLowerCase()).toBe('yesterday');
            expect(ru.toLowerCase()).toBe('вчера');
        });
    });

    describe('formatList', () => {
        it('formats lists with conjunctions', () => {
            const items = ['Apple', 'Orange', 'Banana'];
            const en = formatList(items, undefined, 'en');
            const ru = formatList(items, undefined, 'ru');

            expect(en).toBe('Apple, Orange, and Banana');
            expect(ru).toBe('Apple, Orange и Banana');
        });
    });

    describe('formatBytes', () => {
        it('formats bytes in English and Russian', () => {
            expect(formatBytes(0, undefined, 'en')).toBe('0 B');
            expect(formatBytes(0, undefined, 'ru')).toBe('0 Б');

            expect(formatBytes(1024, undefined, 'en')).toBe('1 KB');
            expect(formatBytes(1024, undefined, 'ru')).toBe('1 КБ');

            expect(formatBytes(1572864, { decimals: 1 }, 'en')).toBe('1.5 MB');
            expect(formatBytes(1572864, { decimals: 1 }, 'ru')).toBe('1,5 МБ');

            expect(formatBytes(1073741824, undefined, 'en')).toBe('1 GB');
            expect(formatBytes(1073741824, undefined, 'ru')).toBe('1 ГБ');
        });
    });

    describe('formatDuration', () => {
        it('formats digital style duration', () => {
            expect(formatDuration(45, { style: 'digital' })).toBe('0:45');
            expect(formatDuration(125, { style: 'digital' })).toBe('2:05');
            expect(formatDuration(3665, { style: 'digital' })).toBe('1:01:05');
        });

        it('formats short style duration in en and ru', () => {
            expect(formatDuration(3660, { style: 'short' }, 'en')).toBe('1 hr 1 min');
            expect(formatDuration(3660, { style: 'short' }, 'ru')).toBe('1 ч 1 мин');
        });

        it('formats long style duration with Russian plural rules', () => {
            expect(formatDuration(3600, { style: 'long' }, 'ru')).toBe('1 час');
            expect(formatDuration(7200, { style: 'long' }, 'ru')).toBe('2 часа');
            expect(formatDuration(18000, { style: 'long' }, 'ru')).toBe('5 часов');
            expect(formatDuration(75600, { style: 'long' }, 'ru')).toBe('21 час');

            expect(formatDuration(60, { style: 'long' }, 'ru')).toBe('1 минута');
            expect(formatDuration(120, { style: 'long' }, 'ru')).toBe('2 минуты');
            expect(formatDuration(300, { style: 'long' }, 'ru')).toBe('5 минут');
            expect(formatDuration(1260, { style: 'long' }, 'ru')).toBe('21 минута');
        });
    });
});
