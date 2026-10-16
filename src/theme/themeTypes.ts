import { type MsgStruct } from '@actdim/msgmesh/contracts';
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

export type ThemePreference = 'system' | 'light' | 'dark';

export type ThemeMode = 'light' | 'dark';

export type ThemeInfo = {
    preference: ThemePreference;
    mode: ThemeMode;
};

export type ThemeMsgStruct = MsgStruct<{
    'APP.THEME.CHANGED': {
        in: ThemeInfo;
    };
    'APP.THEME.SET_PREFERENCE': {
        in: { preference: ThemePreference };
    };
}>;

export type UiThemeMsgStruct = BaseAppMsgStruct & ThemeMsgStruct;

export type ThemeMsgChannels<TChannel extends keyof UiThemeMsgStruct | Array<keyof UiThemeMsgStruct>> =
    TChannel extends Array<infer U> ? (U extends keyof UiThemeMsgStruct ? U : never) : (TChannel extends keyof UiThemeMsgStruct ? TChannel : never);

export type ThemeServiceOptions = {
    storageKey?: string;
    onThemeChanged?: (info: ThemeInfo) => void;
};
