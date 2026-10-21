import { type LocaleCode } from './i18nTypes';
import { getI18nInstance } from './i18nRuntime';

function getActiveLocale(locale?: LocaleCode): LocaleCode {
    if (locale) {
        return locale;
    }

    try {
        const inst = getI18nInstance();
        if (inst && inst.language) {
            return inst.language;
        }
    } catch {
        // Fallback when runtime not initialized
    }

    return 'en';
}

// Caches for Intl instances
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();
const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>();
const listFormatCache = new Map<string, Intl.ListFormat>();

function getDateTimeFormatter(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = `${locale}:${JSON.stringify(options || {})}`;
    let fmt = dateTimeFormatCache.get(key);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat(locale, options);
        dateTimeFormatCache.set(key, fmt);
    }

    return fmt;
}

function getNumberFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = `${locale}:${JSON.stringify(options || {})}`;
    let fmt = numberFormatCache.get(key);
    if (!fmt) {
        fmt = new Intl.NumberFormat(locale, options);
        numberFormatCache.set(key, fmt);
    }

    return fmt;
}

function getRelativeTimeFormatter(locale: string, options?: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
    const key = `${locale}:${JSON.stringify(options || {})}`;
    let fmt = relativeTimeFormatCache.get(key);
    if (!fmt) {
        fmt = new Intl.RelativeTimeFormat(locale, options);
        relativeTimeFormatCache.set(key, fmt);
    }

    return fmt;
}

function getListFormatter(locale: string, options?: Intl.ListFormatOptions): Intl.ListFormat {
    const key = `${locale}:${JSON.stringify(options || {})}`;
    let fmt = listFormatCache.get(key);
    if (!fmt) {
        fmt = new Intl.ListFormat(locale, options);
        listFormatCache.set(key, fmt);
    }

    return fmt;
}

export function formatDate(
    date: Date | number | string,
    options?: Intl.DateTimeFormatOptions,
    locale?: LocaleCode,
): string {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const targetLocale = getActiveLocale(locale);
    const opts: Intl.DateTimeFormatOptions = options ?? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };

    return getDateTimeFormatter(targetLocale, opts).format(d);
}

export function formatDateTime(
    date: Date | number | string,
    options?: Intl.DateTimeFormatOptions,
    locale?: LocaleCode,
): string {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const targetLocale = getActiveLocale(locale);
    const opts: Intl.DateTimeFormatOptions = options ?? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };

    return getDateTimeFormatter(targetLocale, opts).format(d);
}

export function formatNumber(
    value: number,
    options?: Intl.NumberFormatOptions,
    locale?: LocaleCode,
): string {
    const targetLocale = getActiveLocale(locale);

    return getNumberFormatter(targetLocale, options).format(value);
}

export function formatRelative(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: Intl.RelativeTimeFormatOptions,
    locale?: LocaleCode,
): string {
    const targetLocale = getActiveLocale(locale);
    const opts: Intl.RelativeTimeFormatOptions = options ?? { numeric: 'auto' };

    return getRelativeTimeFormatter(targetLocale, opts).format(value, unit);
}

export function formatList(
    items: readonly string[],
    options?: Intl.ListFormatOptions,
    locale?: LocaleCode,
): string {
    const targetLocale = getActiveLocale(locale);
    const opts: Intl.ListFormatOptions = options ?? { style: 'long', type: 'conjunction' };

    return getListFormatter(targetLocale, opts).format(items);
}

const BYTE_UNITS_EN = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
const BYTE_UNITS_RU = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ', 'ПБ'] as const;

export function formatBytes(
    bytes: number,
    options?: { decimals?: number },
    locale?: LocaleCode,
): string {
    const targetLocale = getActiveLocale(locale);
    const isRu = targetLocale.toLowerCase().startsWith('ru');
    const units = isRu ? BYTE_UNITS_RU : BYTE_UNITS_EN;

    if (!Number.isFinite(bytes) || bytes === 0) {
        return `0 ${units[0]}`;
    }

    const absBytes = Math.abs(bytes);
    const k = 1024;
    const i = Math.min(Math.floor(Math.log(absBytes) / Math.log(k)), units.length - 1);
    const decimals = options?.decimals ?? (i === 0 ? 0 : 1);
    const val = bytes / Math.pow(k, i);

    const formattedVal = formatNumber(val, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }, targetLocale);

    return `${formattedVal} ${units[i]}`;
}

export type DurationStyle = 'short' | 'long' | 'digital';

export function formatDuration(
    seconds: number,
    options?: { style?: DurationStyle },
    locale?: LocaleCode,
): string {
    const targetLocale = getActiveLocale(locale);
    const style = options?.style ?? 'short';
    const isRu = targetLocale.toLowerCase().startsWith('ru');

    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (style === 'digital') {
        const mm = String(minutes).padStart(2, '0');
        const ss = String(secs).padStart(2, '0');
        if (hours > 0) {
            return `${hours}:${mm}:${ss}`;
        }

        return `${minutes}:${ss}`;
    }

    const parts: string[] = [];

    if (hours > 0) {
        if (style === 'long') {
            if (isRu) {
                const form = getRuPlural(hours, 'час', 'часа', 'часов');
                parts.push(`${hours} ${form}`);
            } else {
                parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
            }
        } else {
            parts.push(`${hours} ${isRu ? 'ч' : 'hr'}`);
        }
    }

    if (minutes > 0 || (hours === 0 && secs === 0)) {
        if (style === 'long') {
            if (isRu) {
                const form = getRuPlural(minutes, 'минута', 'минуты', 'минут');
                parts.push(`${minutes} ${form}`);
            } else {
                parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
            }
        } else {
            parts.push(`${minutes} ${isRu ? 'мин' : 'min'}`);
        }
    }

    if (secs > 0 || parts.length === 0) {
        if (style === 'long') {
            if (isRu) {
                const form = getRuPlural(secs, 'секунда', 'секунды', 'секунд');
                parts.push(`${secs} ${form}`);
            } else {
                parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
            }
        } else {
            parts.push(`${secs} ${isRu ? 'сек' : 'sec'}`);
        }
    }

    return parts.join(' ');
}

function getRuPlural(n: number, one: string, few: string, many: string): string {
    const abs = Math.abs(n) % 100;
    const num = abs % 10;
    if (abs > 10 && abs < 20) {
        return many;
    }
    if (num > 1 && num < 5) {
        return few;
    }
    if (num === 1) {
        return one;
    }

    return many;
}
