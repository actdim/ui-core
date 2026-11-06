import path from 'node:path';
import type { PluginOption } from 'vite';
import { generateAppThemeTokens } from './generate.ts';
import type { AppThemeOptions } from './generate.ts';

export function themeTokensPlugin(options: AppThemeOptions): PluginOption {
    return {
        name: 'actdim-theme-tokens',
        buildStart() {
            const written = generateAppThemeTokens(options);
            if (written) {
                this.info(`Theme tokens regenerated: ${options.outFile}`);
            }
        },
        handleHotUpdate(ctx) {
            if (path.resolve(ctx.file) === path.resolve(options.appCssFile)) {
                generateAppThemeTokens(options);
            }
        },
    };
}
