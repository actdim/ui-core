/*
 * Theme token generator.
 *
 * Reads the design tokens declared in `src/theme/theme.css` (Tailwind 4 `@theme static`
 * blocks plus the `.dark` / `[data-tier="..."]` overrides) and emits
 * `src/theme/theme.generated.ts`:
 *   - `themeTokens`: every token grouped by scale with its CSS variable, default value,
 *     per-mode overrides and sub-properties (e.g. a text style's line height);
 *   - `themeUtilities` / `themeVariants`: custom `@utility` and `@custom-variant` names.
 * Scale types (`ThemeColor`, `ThemeSpacing`, ...) and the tailwind-merge configuration are
 * derived from `themeTokens` in `src/theme/tw.ts`.
 *
 * Run: `pnpm theme:gen` (also runs from the Vite plugin when theme.css changes).
 */
import path from 'path';
import { pathToFileURL } from 'url';
import {
    coreThemeCssFile,
    coreThemeGeneratedFile,
    generateThemeTokens,
    parseTheme,
    renderThemeTokens,
} from './src/theme/tooling/index.ts';

export const themeCssFile = coreThemeCssFile;
export const themeGeneratedFile = coreThemeGeneratedFile;

export { parseTheme, renderThemeTokens, generateThemeTokens };

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const written = generateThemeTokens();
    console.info(written ? `theme tokens written: ${themeGeneratedFile}` : 'theme tokens up to date');
}
