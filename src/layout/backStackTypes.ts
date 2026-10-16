import { type MsgStruct } from '@actdim/msgmesh/contracts';
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

export type BackHandler = {
    id: string;
    priority: number;
    handle: () => boolean;
};

export type BackStackMsgStruct = MsgStruct<{
    'APP.NAV.BACK': {
        in?: void;
        out: { handled: boolean };
    };
    'APP.NAV.BACK_HANDLER_REGISTER': {
        in: BackHandler;
    };
    'APP.NAV.BACK_HANDLER_UNREGISTER': {
        in: { id: string };
    };
    'APP.NAV.CAN_GO_BACK': {
        in: { canGoBack: boolean };
    };
    'APP.NAV.CONTEXT.CHANGED': {
        in?: void;
    };
    'APP.HOST.BACK': {
        in?: void;
        out: { handled: boolean };
    };
}>;

export type UiBackStackMsgStruct = BaseAppMsgStruct & BackStackMsgStruct;

export type BackStackMsgChannels<TChannel extends keyof UiBackStackMsgStruct | Array<keyof UiBackStackMsgStruct>> =
    TChannel extends Array<infer U> ? (U extends keyof UiBackStackMsgStruct ? U : never) : (TChannel extends keyof UiBackStackMsgStruct ? TChannel : never);

export type BackStackServiceOptions = {
    onUnhandledBack?: () => boolean;
};
