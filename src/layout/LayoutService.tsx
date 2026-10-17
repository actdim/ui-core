import React from 'react';
import {
    type ComponentParams,
    type ComponentStruct,
    type Component,
    type ComponentDef,
    type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import {
    type InputPointer,
    type LayoutInfo,
    type LayoutOrientation,
    type LayoutTier,
    type SafeAreaInsets,
    type LayoutMsgStruct,
    type UiLayoutMsgStruct,
    type LayoutMsgChannels,
} from './layoutTypes';

const defaultSafeArea: SafeAreaInsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
};

let cachedLayout: LayoutInfo = {
    tier: 'expanded',
    pointer: 'fine',
    orientation: 'landscape',
    safeArea: { ...defaultSafeArea },
    keyboardVisible: false,
};

let activeInputFocused = false;

const isTextInputElement = (el: Element | null): boolean => {
    if (!el) {
        return false;
    }
    const tag = el.tagName;
    if (tag === 'INPUT') {
        const type = (el as HTMLInputElement).type?.toLowerCase();
        return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(type);
    }
    if (tag === 'TEXTAREA') {
        return true;
    }
    return (el as HTMLElement).isContentEditable === true;
};

export const getCurrentLayout = (): LayoutInfo => {
    return cachedLayout;
};

export const resolveCurrentLayout = (): LayoutInfo => {
    if (typeof window === 'undefined') {
        return cachedLayout;
    }

    const width = window.innerWidth;
    let tier: LayoutTier = 'expanded';
    if (width < 768) {
        tier = 'compact';
    } else if (width < 1024) {
        tier = 'medium';
    }

    const isPointerCoarse = window.matchMedia
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
    const pointer: InputPointer = isPointerCoarse ? 'coarse' : 'fine';

    const isPortrait = window.matchMedia
        ? window.matchMedia('(orientation: portrait)').matches
        : window.innerHeight > window.innerWidth;
    const orientation: LayoutOrientation = isPortrait ? 'portrait' : 'landscape';

    let keyboardVisible = false;
    if (tier === 'compact') {
        if (window.visualViewport) {
            const heightDiff = window.innerHeight - window.visualViewport.height;
            if (heightDiff > 150) {
                keyboardVisible = true;
            }
        }
        if (!keyboardVisible && activeInputFocused) {
            keyboardVisible = true;
        } else if (!keyboardVisible && typeof document !== 'undefined' && isTextInputElement(document.activeElement)) {
            keyboardVisible = true;
        }
    }

    return {
        tier,
        pointer,
        orientation,
        safeArea: { ...cachedLayout.safeArea },
        keyboardVisible,
    };
};

export const applyLayoutAttributesToHtml = (layout: LayoutInfo): void => {
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-tier', layout.tier);
        document.documentElement.setAttribute('data-pointer', layout.pointer);
        if (layout.keyboardVisible) {
            document.documentElement.setAttribute('data-keyboard', 'visible');
        } else {
            document.documentElement.removeAttribute('data-keyboard');
        }
    }
};

export const applySafeAreaToCssVariables = (safeArea: SafeAreaInsets): void => {
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.style.setProperty('--safe-top', `${safeArea.top}px`);
        document.documentElement.style.setProperty('--safe-right', `${safeArea.right}px`);
        document.documentElement.style.setProperty('--safe-bottom', `${safeArea.bottom}px`);
        document.documentElement.style.setProperty('--safe-left', `${safeArea.left}px`);
    }
};

export const initLayoutService = (msgBus: MsgBus<LayoutMsgStruct>): () => void => {
    const layout = resolveCurrentLayout();
    cachedLayout = layout;
    applyLayoutAttributesToHtml(layout);

    msgBus.send({
        channel: 'APP.LAYOUT.CHANGED',
        payload: layout,
    });

    const checkAndPublish = () => {
        const next = resolveCurrentLayout();
        const hasChanged =
            next.tier !== cachedLayout.tier ||
            next.pointer !== cachedLayout.pointer ||
            next.orientation !== cachedLayout.orientation ||
            next.keyboardVisible !== cachedLayout.keyboardVisible;

        if (hasChanged) {
            cachedLayout = next;
            applyLayoutAttributesToHtml(next);
            msgBus.send({
                channel: 'APP.LAYOUT.CHANGED',
                payload: next,
            });
        }
    };

    const handleVisualViewportResize = () => {
        checkAndPublish();
    };

    const handleFocusIn = (event: FocusEvent) => {
        if (isTextInputElement(event.target as Element | null)) {
            activeInputFocused = true;
            checkAndPublish();
        }
    };

    const handleFocusOut = () => {
        activeInputFocused = false;
        checkAndPublish();
    };

    const mediaQueries = [
        '(min-width: 48rem)',
        '(min-width: 64rem)',
        '(pointer: coarse)',
        '(orientation: portrait)',
    ];

    const mqlList: MediaQueryList[] = [];

    if (typeof window !== 'undefined' && window.matchMedia) {
        for (const query of mediaQueries) {
            try {
                const mql = window.matchMedia(query);
                mql.addEventListener('change', checkAndPublish);
                mqlList.push(mql);
            } catch (_err) {
                // Fallback for older environments
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('resize', checkAndPublish);
        window.addEventListener('orientationchange', checkAndPublish);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualViewportResize);
        }
        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);
    }

    // Support safe-area updates via standard channel
    msgBus.on({
        channel: 'APP.LAYOUT.SET_SAFE_AREA',
        group: 'in',
        callback: (msg) => {
            if (msg.payload) {
                cachedLayout.safeArea = { ...msg.payload };
                applySafeAreaToCssVariables(cachedLayout.safeArea);
                msgBus.send({
                    channel: 'APP.LAYOUT.CHANGED',
                    payload: { ...cachedLayout },
                });
            }
        },
    });

    return () => {
        for (const mql of mqlList) {
            mql.removeEventListener('change', checkAndPublish);
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', checkAndPublish);
            window.removeEventListener('orientationchange', checkAndPublish);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
            }
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        }
    };
};

export type LayoutServiceStruct<TMsg extends UiLayoutMsgStruct = UiLayoutMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: LayoutInfo;
        msgScope: {
            subscribe: LayoutMsgChannels<'APP.LAYOUT.CHANGED'>;
        };
    }
>;

export const useLayoutService = (params: ComponentParams<LayoutServiceStruct>) => {
    let c: Component<LayoutServiceStruct>;
    let _m: ComponentModel<LayoutServiceStruct>;

    const initialLayout = resolveCurrentLayout();

    const def: ComponentDef<LayoutServiceStruct> = {
        props: initialLayout,
        msgBroker: {
            subscribe: {
                'APP.LAYOUT.CHANGED': {
                    in: {
                        callback: (msg) => {
                            if (msg.payload) {
                                c.model.tier = msg.payload.tier;
                                c.model.pointer = msg.payload.pointer;
                                c.model.orientation = msg.payload.orientation;
                                c.model.safeArea = msg.payload.safeArea;
                                c.model.keyboardVisible = msg.payload.keyboardVisible;
                                applyLayoutAttributesToHtml(msg.payload);
                            }
                        },
                    },
                },
            },
        },
        view: () => {
            return null;
        },
    };

    c = useComponent(def, params);
    _m = c.model;

    return c;
};

export const LayoutService = toReact(useLayoutService);
