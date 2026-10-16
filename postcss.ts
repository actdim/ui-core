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
import postcss from 'postcss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export const themeCssFile = path.join(rootDir, 'src', 'theme', 'theme.css');
export const themeGeneratedFile = path.join(rootDir, 'src', 'theme', 'theme.generated.ts');

type ScaleDef = {
    key: string;
    prefix: string;
};

// Order matters: a longer prefix must come before a shorter one it starts with
// (`--font-weight-` before `--font-`).
const scales: ScaleDef[] = [
    { key: 'color', prefix: '--color-' },
    { key: 'spacing', prefix: '--spacing-' },
    { key: 'container', prefix: '--container-' },
    { key: 'text', prefix: '--text-' },
    { key: 'fontWeight', prefix: '--font-weight-' },
    { key: 'font', prefix: '--font-' },
    { key: 'borderWidth', prefix: '--border-width-' },
    { key: 'ringWidth', prefix: '--ring-width-' },
    { key: 'outlineWidth', prefix: '--outline-width-' },
    { key: 'radius', prefix: '--radius-' },
    { key: 'shadow', prefix: '--shadow-' },
    { key: 'zIndex', prefix: '--z-index-' },
    { key: 'duration', prefix: '--transition-duration-' },
    { key: 'ease', prefix: '--ease-' },
    { key: 'opacity', prefix: '--opacity-' },
];

type TokenEntry = {
    var: string;
    value: string;
    modes: Record<string, string>;
    props: Record<string, string>;
};

type ParsedTheme = {
    tokens: Record<string, Record<string, TokenEntry>>;
    utilities: string[];
    variants: string[];
};

function findScale(prop: string): ScaleDef | undefined {
    return scales.find((s) => prop.startsWith(s.prefix));
}

// `.dark` -> "dark", `[data-tier="compact"]` -> "compact"; anything else is not a theme mode.
function modeFromSelector(selector: string): string | undefined {
    const trimmed = selector.trim();
    const cls = /^\.([a-zA-Z][\w-]*)$/.exec(trimmed);
    if (cls) {
        return cls[1];
    }
    const attr = /^\[data-[\w-]+=["']?([\w-]+)["']?\]$/.exec(trimmed);
    if (attr) {
        return attr[1];
    }

    return undefined;
}

export function parseTheme(css: string): ParsedTheme {
    const root = postcss.parse(css);
    const tokens: Record<string, Record<string, TokenEntry>> = {};
    for (const scale of scales) {
        tokens[scale.key] = {};
    }

    const resolve = (prop: string): { scale: ScaleDef; name: string; sub?: string } | undefined => {
        const scale = findScale(prop);
        if (!scale) {
            return undefined;
        }
        const rest = prop.slice(scale.prefix.length);
        const subIndex = rest.indexOf('--');
        if (subIndex >= 0) {
            return { scale, name: rest.slice(0, subIndex), sub: rest.slice(subIndex + 2) };
        }

        return { scale, name: rest };
    };

    // 1. Defaults from `@theme static` blocks.
    root.walkAtRules('theme', (atRule) => {
        atRule.walkDecls((decl) => {
            const ref = resolve(decl.prop);
            if (!ref) {
                return;
            }
            const scaleTokens = tokens[ref.scale.key];
            if (ref.sub) {
                const token = scaleTokens[ref.name];
                if (!token) {
                    throw new Error(`theme.css: sub-property ${decl.prop} is declared before its token`);
                }
                token.props[ref.sub] = decl.value;

                return;
            }
            scaleTokens[ref.name] = { var: decl.prop, value: decl.value, modes: {}, props: {} };
        });
    });

    // 2. Mode overrides (`.dark { ... }`, `[data-tier="compact"] { ... }`).
    root.walkRules((rule) => {
        const mode = modeFromSelector(rule.selector);
        if (!mode) {
            return;
        }
        rule.each((node) => {
            if (node.type !== 'decl') {
                return;
            }
            const ref = resolve(node.prop);
            if (!ref || ref.sub) {
                return;
            }
            const token = tokens[ref.scale.key][ref.name];
            if (!token) {
                throw new Error(`theme.css: ${rule.selector} overrides unknown token ${node.prop}`);
            }
            token.modes[mode] = node.value;
        });
    });

    const utilities: string[] = [];
    root.walkAtRules('utility', (atRule) => {
        utilities.push(atRule.params.trim());
    });

    const variants: string[] = [];
    root.walkAtRules('custom-variant', (atRule) => {
        variants.push(atRule.params.trim().split(/\s+/)[0]);
    });

    return { tokens, utilities, variants };
}

function quote(value: string): string {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s+/g, ' ')}'`;
}

function renderRecord(record: Record<string, string>): string {
    const entries = Object.entries(record).map(([k, v]) => `${quote(k)}: ${quote(v)}`);

    return `{ ${entries.join(', ')} }`;
}

export function renderThemeTokens(css: string): string {
    const theme = parseTheme(css);
    const lines: string[] = [];
    lines.push('// GENERATED by postcss.ts (pnpm theme:gen) from src/theme/theme.css. Do not edit.');
    lines.push('');
    lines.push('export const themeTokens = {');
    for (const scale of scales) {
        lines.push(`    ${scale.key}: {`);
        for (const [name, token] of Object.entries(theme.tokens[scale.key])) {
            const parts = [`var: ${quote(token.var)}`, `value: ${quote(token.value)}`];
            if (Object.keys(token.modes).length > 0) {
                parts.push(`modes: ${renderRecord(token.modes)}`);
            }
            if (Object.keys(token.props).length > 0) {
                parts.push(`props: ${renderRecord(token.props)}`);
            }
            lines.push(`        ${quote(name)}: { ${parts.join(', ')} },`);
        }
        lines.push('    },');
    }
    lines.push('} as const;');
    lines.push('');
    lines.push('export const themeCssVars = {');
    for (const scale of scales) {
        lines.push(`    ${scale.key}: {`);
        for (const [name, token] of Object.entries(theme.tokens[scale.key])) {
            lines.push(`        ${quote(name)}: ${quote(token.var)},`);
        }
        lines.push('    },');
    }
    lines.push('} as const;');
    lines.push('');
    lines.push(`export const themeUtilities = [${theme.utilities.map(quote).join(', ')}] as const;`);
    lines.push('');
    lines.push(`export const themeVariants = [${theme.variants.map(quote).join(', ')}] as const;`);
    lines.push('');

    return lines.join('\n');
}

/** Regenerates the TS file; writes only when the content changed. Returns true if written. */
export function generateThemeTokens(cssFile: string = themeCssFile, outFile: string = themeGeneratedFile): boolean {
    const output = renderThemeTokens(fs.readFileSync(cssFile, 'utf8'));
    const current = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : undefined;
    if (current === output) {
        return false;
    }
    fs.writeFileSync(outFile, output, 'utf8');

    return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const written = generateThemeTokens();
    console.info(written ? `theme tokens written: ${themeGeneratedFile}` : 'theme tokens up to date');
}
