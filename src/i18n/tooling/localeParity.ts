import * as fs from 'fs';
import * as path from 'path';

export type LocaleParityKey = {
    locale: string;
    ns: string;
    key: string;
};

export type LocaleParityResult = {
    valid: boolean;
    sourceLocale: string;
    locales: string[];
    namespaces: string[];
    missingKeys: LocaleParityKey[];
    extraKeys: LocaleParityKey[];
    errors: string[];
    warnings: string[];
};

export type LocaleParityOptions = {
    sourceLocale?: string;
};

function flattenKeys(obj: unknown, prefix = ''): string[] {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return prefix ? [prefix] : [];
    }

    const record = obj as Record<string, unknown>;
    const keys: string[] = [];

    for (const [key, value] of Object.entries(record)) {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            keys.push(...flattenKeys(value, nextPrefix));
        } else {
            keys.push(nextPrefix);
        }
    }

    return keys;
}

export function checkLocaleParity(
    localesDir: string,
    options: LocaleParityOptions = {},
): LocaleParityResult {
    const sourceLocale = options.sourceLocale ?? 'en';
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingKeys: LocaleParityKey[] = [];
    const extraKeys: LocaleParityKey[] = [];

    if (!fs.existsSync(localesDir)) {
        return {
            valid: false,
            sourceLocale,
            locales: [],
            namespaces: [],
            missingKeys,
            extraKeys,
            errors: [`Locales directory does not exist: ${localesDir}`],
            warnings,
        };
    }

    const sourceDir = path.join(localesDir, sourceLocale);
    if (!fs.existsSync(sourceDir)) {
        return {
            valid: false,
            sourceLocale,
            locales: [],
            namespaces: [],
            missingKeys,
            extraKeys,
            errors: [`Source locale directory does not exist: ${sourceDir}`],
            warnings,
        };
    }

    // Discover namespaces in source directory
    const sourceFiles = fs
        .readdirSync(sourceDir)
        .filter((f) => f.endsWith('.json'));

    const namespaces = sourceFiles.map((f) => path.basename(f, '.json'));

    // Cache source keys by namespace
    const sourceKeysByNs = new Map<string, Set<string>>();
    for (const file of sourceFiles) {
        const ns = path.basename(file, '.json');
        try {
            const content = fs.readFileSync(path.join(sourceDir, file), 'utf8');
            const parsed = JSON.parse(content);
            sourceKeysByNs.set(ns, new Set(flattenKeys(parsed)));
        } catch (err) {
            errors.push(`Failed to parse source locale file ${sourceLocale}/${file}: ${String(err)}`);
        }
    }

    // Discover all locales in localesDir
    const entries = fs.readdirSync(localesDir, { withFileTypes: true });
    const locales = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
        .map((e) => e.name);

    for (const locale of locales) {
        if (locale === sourceLocale) {
            continue;
        }

        const localeDir = path.join(localesDir, locale);

        // Check each source namespace in this target locale
        for (const [ns, sourceKeys] of sourceKeysByNs.entries()) {
            const targetFile = path.join(localeDir, `${ns}.json`);
            if (!fs.existsSync(targetFile)) {
                errors.push(`[${locale}] missing namespace file: ${ns}.json`);
                for (const key of sourceKeys) {
                    missingKeys.push({ locale, ns, key });
                }
                continue;
            }

            let targetKeys: Set<string>;
            try {
                const content = fs.readFileSync(targetFile, 'utf8');
                const parsed = JSON.parse(content);
                targetKeys = new Set(flattenKeys(parsed));
            } catch (err) {
                errors.push(`[${locale}] failed to parse ${ns}.json: ${String(err)}`);
                continue;
            }

            // Find missing keys
            for (const key of sourceKeys) {
                if (!targetKeys.has(key)) {
                    missingKeys.push({ locale, ns, key });
                    errors.push(`[${locale}] missing key "${key}" in namespace "${ns}"`);
                }
            }

            // Find extra keys
            for (const key of targetKeys) {
                if (!sourceKeys.has(key)) {
                    extraKeys.push({ locale, ns, key });
                    warnings.push(`[${locale}] extra key "${key}" in namespace "${ns}"`);
                }
            }
        }

        // Check if target locale has extra namespace files
        const targetFiles = fs
            .readdirSync(localeDir)
            .filter((f) => f.endsWith('.json'));

        for (const targetFile of targetFiles) {
            const targetNs = path.basename(targetFile, '.json');
            if (!sourceKeysByNs.has(targetNs)) {
                warnings.push(`[${locale}] extra namespace file not present in ${sourceLocale}: ${targetFile}`);
            }
        }
    }

    const valid = errors.length === 0 && missingKeys.length === 0;

    return {
        valid,
        sourceLocale,
        locales,
        namespaces,
        missingKeys,
        extraKeys,
        errors,
        warnings,
    };
}
