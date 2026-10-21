import { type MsgStruct } from '@actdim/msgmesh/contracts';
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

export type LocaleCode = string;

export type LocaleDirection = 'ltr' | 'rtl';

export type LocalePreference = LocaleCode | 'system';

export type LocaleSource = 'user' | 'server' | 'host';

export type LocaleInfo = {
    preference: LocalePreference;
    locale: LocaleCode;
    dir: LocaleDirection;
};

export type LocaleChangedPayload = LocaleInfo & {
    source?: LocaleSource;
};

export type LocaleSetPreferencePayload = {
    preference: LocalePreference;
    source?: LocaleSource;
};

export type I18nMsgStruct = MsgStruct<{
    'APP.LOCALE.CHANGED': {
        in: LocaleChangedPayload;
    };
    'APP.LOCALE.SET_PREFERENCE': {
        in: LocaleSetPreferencePayload;
    };
}>;

export type UiI18nMsgStruct = BaseAppMsgStruct & I18nMsgStruct;

export type I18nMsgChannels<TChannel extends keyof UiI18nMsgStruct | Array<keyof UiI18nMsgStruct>> =
    TChannel extends Array<infer U> ? (U extends keyof UiI18nMsgStruct ? U : never) : (TChannel extends keyof UiI18nMsgStruct ? TChannel : never);

export type MessageDescriptor = {
    key: string;
    params?: Record<string, unknown>;
    fallback?: string;
};

export type I18nServiceOptions = {
    storageKey?: string;
    supportedLocales: readonly LocaleCode[];
    fallbackLocale: LocaleCode;
    loadNamespace?: (locale: LocaleCode, ns: string) => Promise<Record<string, unknown>>;
    hostLocale?: () => LocaleCode | undefined;
    onLocaleChanged?: (info: LocaleChangedPayload) => void;
    bootNamespaces?: readonly string[];
    pseudoLocale?: string;
    enablePseudo?: boolean;
};
