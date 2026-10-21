import * as path from 'path';
import * as fs from 'fs';
import * as packageJson from './package.json';

const rootPath = __dirname;

const aliases = {
    '@': './src',
};

function getSrcFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        return [];
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries.flatMap((entry) => {
        const fileName = path.resolve(dir, entry.name);
        if (entry.name.startsWith('_')) {
            return [];
        }
        if (entry.isDirectory()) {
            return getSrcFiles(fileName);
        }

        return fileName.endsWith('.ts') || fileName.endsWith('.tsx') ? [fileName] : [];
    });
}

const packages = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
];

export default {
    packages,
    resolveAliases: () => {
        return Object.fromEntries(
            Object.entries(aliases).map(([key, value]) => [key, path.resolve(rootPath, value)]),
        );
    },
    srcFiles: () => getSrcFiles(path.resolve(__dirname, 'src')),
    externals: (id: string) => {
        if (id.startsWith('node:') || ['fs', 'path', 'url', 'crypto', 'os'].includes(id)) {
            return true;
        }

        return packages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));
    },
};
