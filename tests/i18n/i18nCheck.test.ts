import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { checkLocaleParity } from '@/i18n/tooling/localeParity';

describe('checkLocaleParity tooling', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'actdim-i18n-parity-'));
    });

    afterEach(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it('returns valid when all keys match between source and target locales', () => {
        const enDir = path.join(tempDir, 'en');
        const ruDir = path.join(tempDir, 'ru');
        fs.mkdirSync(enDir, { recursive: true });
        fs.mkdirSync(ruDir, { recursive: true });

        const enData = {
            common: {
                ok: 'OK',
                cancel: 'Cancel',
            },
        };

        const ruData = {
            common: {
                ok: 'OK',
                cancel: 'Отмена',
            },
        };

        fs.writeFileSync(path.join(enDir, 'ui.json'), JSON.stringify(enData, null, 2));
        fs.writeFileSync(path.join(ruDir, 'ui.json'), JSON.stringify(ruData, null, 2));

        const result = checkLocaleParity(tempDir, { sourceLocale: 'en' });
        expect(result.valid).toBe(true);
        expect(result.missingKeys).toHaveLength(0);
        expect(result.extraKeys).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
    });

    it('flags missing keys as errors when target locale lacks keys from source', () => {
        const enDir = path.join(tempDir, 'en');
        const ruDir = path.join(tempDir, 'ru');
        fs.mkdirSync(enDir, { recursive: true });
        fs.mkdirSync(ruDir, { recursive: true });

        const enData = {
            common: {
                ok: 'OK',
                cancel: 'Cancel',
                save: 'Save',
            },
        };

        const ruData = {
            common: {
                ok: 'OK',
            },
        };

        fs.writeFileSync(path.join(enDir, 'ui.json'), JSON.stringify(enData, null, 2));
        fs.writeFileSync(path.join(ruDir, 'ui.json'), JSON.stringify(ruData, null, 2));

        const result = checkLocaleParity(tempDir, { sourceLocale: 'en' });
        expect(result.valid).toBe(false);
        expect(result.missingKeys).toHaveLength(2);
        expect(result.missingKeys.map((m) => m.key)).toEqual(
            expect.arrayContaining(['common.cancel', 'common.save']),
        );
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('flags extra keys as warnings when target locale has keys not present in source', () => {
        const enDir = path.join(tempDir, 'en');
        const ruDir = path.join(tempDir, 'ru');
        fs.mkdirSync(enDir, { recursive: true });
        fs.mkdirSync(ruDir, { recursive: true });

        const enData = {
            common: {
                ok: 'OK',
            },
        };

        const ruData = {
            common: {
                ok: 'OK',
                legacyKey: 'Старый ключ',
            },
        };

        fs.writeFileSync(path.join(enDir, 'ui.json'), JSON.stringify(enData, null, 2));
        fs.writeFileSync(path.join(ruDir, 'ui.json'), JSON.stringify(ruData, null, 2));

        const result = checkLocaleParity(tempDir, { sourceLocale: 'en' });
        expect(result.valid).toBe(true); // Warnings do not fail parity
        expect(result.extraKeys).toHaveLength(1);
        expect(result.extraKeys[0].key).toBe('common.legacyKey');
        expect(result.warnings.length).toBe(1);
    });
});
