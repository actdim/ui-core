import { createTheme, type Theme } from '@mui/material/styles';
import { themeTokens } from './theme.generated';
import { themeVar } from './themeVar';
import { type ThemeColor, type ThemeIntent } from './tw';
import { type ThemeMode } from './themeTypes';

// MUI theme built from the semantic theme tokens (src/theme/theme.css), so MUI components and
// Tailwind-styled markup share one palette, radius, font and layer order.

export const muiBreakpoints = {
    values: {
        xs: 0,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
    },
};

type TokenLike = {
    readonly var: string;
    readonly value: string;
    readonly modes?: Readonly<Record<string, string>>;
};

const colors = themeTokens.color;

function color(name: ThemeColor, mode: ThemeMode): string {
    const token = colors[name];
    const modeValue = mode === 'light' ? undefined : (token as { modes?: Record<string, string> }).modes?.[mode];

    return modeValue ?? token.value;
}

function intent(name: ThemeIntent, mode: ThemeMode) {
    return {
        main: color(name, mode),
        dark: color(`${name}-strong`, mode),
        contrastText: color(`${name}-contrast`, mode),
    };
}

function remToPx(value: string): number {
    const rem = /^([\d.]+)rem$/.exec(value);

    return rem ? Number(rem[1]) * 16 : Number.parseFloat(value);
}

function zIndex(token: TokenLike): number {
    return Number(token.value);
}

const touchMin = themeVar('spacing', 'touch');

export const createMuiAppTheme = (mode: ThemeMode = 'light'): Theme => {
    return createTheme({
        breakpoints: muiBreakpoints,
        palette: {
            mode,
            primary: intent('primary', mode),
            secondary: intent('secondary', mode),
            success: intent('success', mode),
            info: intent('info', mode),
            warning: intent('warning', mode),
            error: intent('danger', mode),
            background: {
                default: color('surface-page', mode),
                paper: color('surface-panel', mode),
            },
            text: {
                primary: color('fg-default', mode),
                secondary: color('fg-muted', mode),
                disabled: color('fg-disabled', mode),
            },
            divider: color('line-default', mode),
        },
        shape: {
            borderRadius: remToPx(themeTokens.radius.control.value),
        },
        typography: {
            fontFamily: themeTokens.font.ui.value,
        },
        zIndex: {
            appBar: zIndex(themeTokens.zIndex.header),
            drawer: zIndex(themeTokens.zIndex.drawer),
            modal: zIndex(themeTokens.zIndex.dialog),
            snackbar: zIndex(themeTokens.zIndex.toast),
            tooltip: zIndex(themeTokens.zIndex.tooltip),
        },
        components: {
            MuiBackdrop: {
                styleOverrides: {
                    root: {
                        backgroundColor: themeVar('color', 'surface-scrim'),
                    },
                    invisible: {
                        backgroundColor: 'transparent',
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundColor: themeVar('color', 'surface-dialog'),
                        borderRadius: themeVar('radius', 'dialog'),
                        boxShadow: themeVar('shadow', 'dialog'),
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: themeVar('color', 'surface-dialog'),
                    },
                },
            },
            MuiPopover: {
                styleOverrides: {
                    paper: {
                        backgroundColor: themeVar('color', 'surface-popup'),
                        borderRadius: themeVar('radius', 'popup'),
                        boxShadow: themeVar('shadow', 'popup'),
                    },
                },
            },
            MuiButtonBase: {
                styleOverrides: {
                    root: {
                        '@media (pointer: coarse)': {
                            minHeight: touchMin,
                            minWidth: touchMin,
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        '@media (pointer: coarse)': {
                            minHeight: touchMin,
                            minWidth: touchMin,
                        },
                    },
                },
            },
        },
    });
};

export const defaultMuiTheme = createMuiAppTheme('light');
