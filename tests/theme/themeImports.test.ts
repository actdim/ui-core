import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const themeDir = path.resolve(__dirname, '../../src/theme');

function getAllFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllFiles(fullPath));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }

    return files;
}

describe('theme subpath imports', () => {
    it('contains no imports from @actdim/dynstruct-mui', () => {
        const files = getAllFiles(themeDir);
        expect(files.length).toBeGreaterThan(0);

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            expect(content).not.toContain('@actdim/dynstruct-mui');
        }
    });
});
