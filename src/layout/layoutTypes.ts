import { type MsgStruct } from '@actdim/msgmesh/contracts';
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

export type LayoutTier = 'compact' | 'medium' | 'expanded';
export type InputPointer = 'coarse' | 'fine';
export type PointerKind = InputPointer;
export type LayoutOrientation = 'portrait' | 'landscape';

export type SafeAreaInsets = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export type LayoutInfo = {
    tier: LayoutTier;
    pointer: InputPointer;
    orientation: LayoutOrientation;
    safeArea: SafeAreaInsets;
    keyboardVisible?: boolean;
};

export type LayoutMsgStruct = MsgStruct<{
    'APP.LAYOUT.CHANGED': {
        in: LayoutInfo;
    };
    'APP.LAYOUT.SET_SAFE_AREA': {
        in: SafeAreaInsets;
    };
}>;

export type UiLayoutMsgStruct = BaseAppMsgStruct & LayoutMsgStruct;

export type LayoutMsgChannels<TChannel extends keyof UiLayoutMsgStruct | Array<keyof UiLayoutMsgStruct>> =
    TChannel extends Array<infer U> ? (U extends keyof UiLayoutMsgStruct ? U : never) : (TChannel extends keyof UiLayoutMsgStruct ? TChannel : never);
