import postcss from 'postcss';

export interface ScaleDef {
    key: string;
    prefix: string;
}

// Order matters: a longer prefix must come before a shorter one it starts with
// (`--font-weight-` before `--font-`).
export const scales: ScaleDef[] = [
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

export type ThemeScaleKey =
    | 'color'
    | 'spacing'
    | 'container'
    | 'text'
    | 'fontWeight'
    | 'font'
    | 'borderWidth'
    | 'ringWidth'
    | 'outlineWidth'
    | 'radius'
    | 'shadow'
    | 'zIndex'
    | 'duration'
    | 'ease'
    | 'opacity';

export interface ThemeTokenEntry {
    var: string;
    value: string;
    modes: Record<string, string>;
    props: Record<string, string>;
}

export interface ParsedTheme {
    tokens: Record<string, Record<string, ThemeTokenEntry>>;
    utilities: string[];
    variants: string[];
}

export function findScale(prop: string): ScaleDef | undefined {
    return scales.find((s) => prop.startsWith(s.prefix));
}

// `.dark` -> "dark", `[data-tier="compact"]` -> "compact"; anything else is not a theme mode.
export function modeFromSelector(selector: string): string | undefined {
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

export function parseTheme(css: string, baseTheme?: ParsedTheme): ParsedTheme {
    const root = postcss.parse(css);
    const tokens: Record<string, Record<string, ThemeTokenEntry>> = {};
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
            let token = tokens[ref.scale.key][ref.name];
            if (!token && baseTheme?.tokens[ref.scale.key]?.[ref.name]) {
                const baseEntry = baseTheme.tokens[ref.scale.key][ref.name];
                token = {
                    var: baseEntry.var,
                    value: baseEntry.value,
                    modes: {},
                    props: { ...baseEntry.props },
                };
                tokens[ref.scale.key][ref.name] = token;
            }
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
