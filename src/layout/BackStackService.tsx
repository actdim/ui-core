import React from 'react';
import {
    type ComponentParams,
    type ComponentStruct,
    type Component,
    type ComponentDef,
    type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import {
    type BackHandler,
    type BackStackMsgChannels,
    type UiBackStackMsgStruct,
    type BackStackServiceOptions,
} from './backStackTypes';

type BackStackRegistrationBus = {
    send(params:
        | { channel: 'APP.NAV.BACK_HANDLER_REGISTER'; payload: BackHandler }
        | { channel: 'APP.NAV.BACK_HANDLER_UNREGISTER'; payload: { id: string } }
    ): Promise<unknown> | void;
};

let sharedMsgBus: BackStackRegistrationBus | null = null;
const pendingRegistrations: BackHandler[] = [];
let unhandledBackCallback: (() => boolean) | null = null;

export const setUnhandledBackHandler = (handler: (() => boolean) | null) => {
    unhandledBackCallback = handler;
};

export const registerBackHandler = (handler: BackHandler) => {
    if (sharedMsgBus) {
        void sharedMsgBus.send({
            channel: 'APP.NAV.BACK_HANDLER_REGISTER',
            payload: handler,
        });
    } else {
        pendingRegistrations.push(handler);
    }
};

export const unregisterBackHandler = (id: string) => {
    if (sharedMsgBus) {
        void sharedMsgBus.send({
            channel: 'APP.NAV.BACK_HANDLER_UNREGISTER',
            payload: { id },
        });
    } else {
        const idx = pendingRegistrations.findIndex((h) => {
            return h.id === id;
        });
        if (idx !== -1) {
            pendingRegistrations.splice(idx, 1);
        }
    }
};

type BackStackState = {
    handlers: BackHandler[];
};

export type BackStackServiceStruct<TMsg extends UiBackStackMsgStruct = UiBackStackMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: BackStackState;
        msgScope: {
            publish: BackStackMsgChannels<
                | 'APP.NAV.CAN_GO_BACK'
                | 'APP.NAV.BACK_HANDLER_REGISTER'
                | 'APP.NAV.BACK_HANDLER_UNREGISTER'
            >;
            subscribe: BackStackMsgChannels<
                | 'APP.NAV.BACK_HANDLER_REGISTER'
                | 'APP.NAV.BACK_HANDLER_UNREGISTER'
                | 'APP.NAV.CONTEXT.CHANGED'
            >;
            provide: BackStackMsgChannels<'APP.NAV.BACK' | 'APP.HOST.BACK'>;
        };
    }
>;

export const useBackStackService = (
    params: ComponentParams<BackStackServiceStruct>,
    options?: BackStackServiceOptions,
) => {
    let c: Component<BackStackServiceStruct>;
    let m: ComponentModel<BackStackServiceStruct>;

    if (options?.onUnhandledBack) {
        unhandledBackCallback = options.onUnhandledBack;
    }

    const evaluateCanGoBack = () => {
        const hasHandlers = (m.handlers || []).length > 0;
        const notAtRoot = typeof window !== 'undefined'
            && window.location.pathname !== '/'
            && window.location.pathname !== '';
        c.msgBus.send({
            channel: 'APP.NAV.CAN_GO_BACK',
            payload: {
                canGoBack: hasHandlers || notAtRoot,
            },
        });
    };

    const handleBack = (): { handled: boolean } => {
        const sorted = [...(m.handlers || [])].sort((a, b) => {
            return b.priority - a.priority;
        });

        for (const entry of sorted) {
            try {
                if (entry.handle()) {
                    evaluateCanGoBack();
                    return { handled: true };
                }
            } catch (err) {
                console.error(`Error in back handler ${entry.id}:`, err);
            }
        }

        if (unhandledBackCallback) {
            try {
                if (unhandledBackCallback()) {
                    return { handled: true };
                }
            } catch (err) {
                console.error('Error in unhandledBackCallback:', err);
            }
        }

        return { handled: false };
    };

    const def: ComponentDef<BackStackServiceStruct> = {
        props: {
            handlers: [],
        },
        events: {
            onReady: () => {
                sharedMsgBus = c.msgBus;
                for (const pending of pendingRegistrations) {
                    void sharedMsgBus.send({
                        channel: 'APP.NAV.BACK_HANDLER_REGISTER',
                        payload: pending,
                    });
                }
                pendingRegistrations.length = 0;

                c.msgBus.provide({
                    channel: 'APP.NAV.BACK',
                    callback: () => {
                        return handleBack();
                    },
                });

                c.msgBus.provide({
                    channel: 'APP.HOST.BACK',
                    callback: () => {
                        return handleBack();
                    },
                });

                evaluateCanGoBack();
            },
            onDestroy: () => {
                sharedMsgBus = null;
            },
        },
        msgBroker: {
            subscribe: {
                'APP.NAV.CONTEXT.CHANGED': {
                    in: {
                        callback: () => {
                            evaluateCanGoBack();
                        },
                    },
                },
                'APP.NAV.BACK_HANDLER_REGISTER': {
                    in: {
                        callback: (msg) => {
                            if (msg.payload) {
                                const current = (m.handlers || []).filter((h) => {
                                    return h.id !== msg.payload.id;
                                });
                                m.handlers = [...current, msg.payload];
                                evaluateCanGoBack();
                            }
                        },
                    },
                },
                'APP.NAV.BACK_HANDLER_UNREGISTER': {
                    in: {
                        callback: (msg) => {
                            if (msg.payload) {
                                m.handlers = (m.handlers || []).filter((h) => {
                                    return h.id !== msg.payload.id;
                                });
                                evaluateCanGoBack();
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
    m = c.model;

    return c;
};

export const BackStackService = toReact(useBackStackService);
