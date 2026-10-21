import * as path from 'path';
import { fileURLToPath } from 'url';
import { checkLocaleParity } from '../src/i18n/tooling/localeParity.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');
const result = checkLocaleParity(localesDir, { sourceLocale: 'en' });

if (result.warnings.length > 0) {
    console.warn(`[i18n:check] Warnings (${result.warnings.length}):`);
    for (const w of result.warnings) {
        console.warn(`  - ${w}`);
    }
}

if (!result.valid) {
    console.error(`[i18n:check] Errors (${result.errors.length}):`);
    for (const e of result.errors) {
        console.error(`  - ${e}`);
    }
    process.exit(1);
} else {
    console.info(`[i18n:check] Locale parity OK across locales: ${result.locales.join(', ')}`);
}
