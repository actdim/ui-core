import React, { useRef } from 'react';
import {
    type Component,
    type ComponentDef,
    type ComponentModel,
    type ComponentParams,
    type ComponentStruct,
    type ComponentStructExt,
} from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { bind, prop } from '@actdim/dynstruct/componentModel/core';
import { useDialog, type DialogStruct } from '@actdim/dynstruct-mui';
import { type LayoutTier, type UiLayoutMsgStruct, type LayoutMsgChannels } from '../layout/layoutTypes';
import { getCurrentLayout } from '../layout/LayoutService';
import { registerBackHandler, unregisterBackHandler } from '../layout/BackStackService';
import { themeVar, tw, type TwClasses } from '../theme/tw';
import { useT } from '../i18n/useT';
import { type MessageDescriptor } from '../i18n/i18nTypes';
import { resolveDescriptorOrNode } from './ActionSheet';

// Closing sets `open` to false: a parent observes it through a two-way binding of `open`
// (`bindProp` / `bind(get, set)`; a React parent: `$events.onChangeOpen`). React content props (title, subtitle,
// children, actions, primaryAction) are ref props: pass them through bindings (`bind(() => <... />)`) to keep them live.
export type AdaptiveDialogProps = {
    open: boolean;
    onClose?: () => void;
    title?: React.ReactNode | MessageDescriptor;
    subtitle?: React.ReactNode | MessageDescriptor;
    tier?: LayoutTier;
    fullScreen?: boolean;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
    fullWidth?: boolean;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    primaryAction?: React.ReactNode;
    contentClassName?: TwClasses;
    paperClassName?: TwClasses;
    backHandlerPriority?: number;
    backHandlerId?: string;
};

export type AdaptiveDialogStruct<TMsg extends UiLayoutMsgStruct = UiLayoutMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: AdaptiveDialogProps;
        actions: {
            close: () => void;
        };
        children: {
            dialog: DialogStruct;
        };
        msgScope: {
            subscribe: LayoutMsgChannels<'APP.LAYOUT.CHANGED'>;
        };
    }
>;

export const useAdaptiveDialog = (params: ComponentParams<AdaptiveDialogStruct>): Component<AdaptiveDialogStruct> => {
    type ImplStruct = ComponentStructExt<
        AdaptiveDialogStruct,
        {
            props: {
                currentTier: LayoutTier;
            };
            children: {
                // fragment children are rendered as observers: the content stays live while the dialog is open
                dialogContent: React.FC;
                dialogActions: React.FC;
            };
            effects: 'backHandler';
        }
    >;

    let c: Component<ImplStruct>;
    let m: ComponentModel<ImplStruct>;

    const t = useT('ui-core');
    const defaultBackHandlerId = React.useId();

    const isCompact = () => (m.fullScreen !== undefined ? m.fullScreen : m.currentTier === 'compact');

    // id / priority of the registered back handler while the dialog is open
    const backHandlerIdRef = useRef<string | null>(null);
    const backHandlerPriorityRef = useRef<number | null>(null);
    const releaseBackHandler = () => {
        if (backHandlerIdRef.current) {
            unregisterBackHandler(backHandlerIdRef.current);
            backHandlerIdRef.current = null;
            backHandlerPriorityRef.current = null;
        }
    };

    const def: ComponentDef<ImplStruct> = {
        props: {
            open: false,
            onClose: undefined,
            title: prop({ reactive: 'ref' }),
            subtitle: prop({ reactive: 'ref' }),
            tier: undefined,
            fullScreen: undefined,
            maxWidth: 'sm',
            fullWidth: true,
            children: prop({ reactive: 'ref' }),
            actions: prop({ reactive: 'ref' }),
            primaryAction: prop({ reactive: 'ref' }),
            contentClassName: undefined,
            paperClassName: undefined,
            backHandlerPriority: 100,
            backHandlerId: undefined,
            currentTier: getCurrentLayout().tier,
        },
        actions: {
            close: () => {
                m.open = false;
                if (m.onClose) {
                    m.onClose();
                }
            },
        },
        children: {
            dialog: useDialog({
                open: bind(() => m.open),
                onClose: () => {
                    m.close();
                },
                fullScreen: bind(() => isCompact()),
                maxWidth: bind(() => m.maxWidth),
                fullWidth: bind(() => m.fullWidth),
                title: bind(() => {
                    if (isCompact()) {
                        return undefined;
                    }

                    const titleContent = resolveDescriptorOrNode(m.title, t);
                    const subtitleContent = resolveDescriptorOrNode(m.subtitle, t);

                    if (!titleContent) {
                        return undefined;
                    }

                    return (
                        <div className={tw('flex items-center justify-between w-full')}>
                            <div>
                                <div className={tw('text-title text-fg-default')}>
                                    {titleContent}
                                </div>
                                {subtitleContent && (
                                    <div className={tw('text-caption text-fg-muted mt-micro')}>
                                        {subtitleContent}
                                    </div>
                                )}
                            </div>
                            <button
                                type='button'
                                onClick={() => {
                                    m.close();
                                }}
                                className={tw('p-tight rounded-control text-fg-faint hover:text-fg-muted hover:bg-surface-hover transition')}
                                title={t('dialog.close')}
                                aria-label={t('dialog.close')}
                            >
                                <span className={tw('iconify tabler--x text-title')} />
                            </button>
                        </div>
                    );
                }),
                content: () => <c.children.DialogContent />,
                actions: () => <c.children.DialogActions />,
                sx: {
                    '& .MuiPaper-root': {
                        backgroundColor: themeVar('color', 'surface-dialog'),
                        borderRadius: themeVar('radius', 'dialog'),
                        boxShadow: themeVar('shadow', 'dialog'),
                    },
                },
            }),
            dialogContent: () => {
                if (isCompact()) {
                    const titleContent = resolveDescriptorOrNode(m.title, t);
                    const subtitleContent = resolveDescriptorOrNode(m.subtitle, t);

                    return (
                        <div className={tw('flex flex-col h-full -m-loose bg-surface-dialog')}>
                            <div className={tw('flex items-center justify-between px-normal py-snug border-b border-line-default bg-surface-dialog sticky top-0 z-sticky shrink-0 pt-safe')}>
                                <div className={tw('flex items-center gap-snug min-w-0 flex-1')}>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            m.close();
                                        }}
                                        className={tw('p-snug rounded-control text-fg-muted hover:text-fg-default hover:bg-surface-hover transition min-w-control-md min-h-control-md flex items-center justify-center cursor-pointer')}
                                        title={t('dialog.back')}
                                        aria-label={t('dialog.back')}
                                    >
                                        <span className={tw('iconify tabler--arrow-left text-title')} />
                                    </button>
                                    <div className={tw('min-w-0 flex-1')}>
                                        {titleContent && (
                                            <h2 className={tw('text-body-lg font-strong text-fg-default truncate')}>
                                                {titleContent}
                                            </h2>
                                        )}
                                        {subtitleContent && (
                                            <p className={tw('text-caption text-fg-muted truncate')}>
                                                {subtitleContent}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {m.primaryAction && (
                                    <div className={tw('shrink-0 ml-snug')}>
                                        {m.primaryAction}
                                    </div>
                                )}
                            </div>

                            <div className={tw('flex-1 overflow-y-auto px-relaxed py-relaxed', m.contentClassName)}>
                                {m.children}
                            </div>

                            {m.actions && (
                                <div className={tw('px-relaxed py-normal border-t border-line-default bg-surface-inset shrink-0 flex items-center justify-end gap-snug pb-[calc(env(safe-area-inset-bottom,0px)+12px)]')}>
                                    {m.actions}
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <div className={tw(m.contentClassName)}>
                        {m.children}
                    </div>
                );
            },
            dialogActions: () => {
                if (isCompact() || !m.actions) {
                    return null;
                }

                return <>{m.actions}</>;
            },
        },
        effects: {
            // auto-tracked: works when the dialog is a def child (the host does not re-render on `open`)
            backHandler: () => {
                if (!m.open) {
                    releaseBackHandler();

                    return;
                }
                const id = m.backHandlerId || backHandlerIdRef.current || `adaptive-dialog-${defaultBackHandlerId}`;
                const priority = m.backHandlerPriority ?? 100;
                // the effect also re-runs on whatever the bound `open` getter reads: re-register only when the id or
                // priority actually changed (keeps the handler's position in the back stack)
                if (backHandlerIdRef.current === id && backHandlerPriorityRef.current === priority) {
                    return;
                }
                releaseBackHandler();
                backHandlerIdRef.current = id;
                backHandlerPriorityRef.current = priority;
                registerBackHandler({
                    id,
                    priority,
                    handle: () => {
                        m.close();

                        return true;
                    },
                });
            },
        },
        events: {
            onReady: () => {
                if (m.tier) {
                    m.currentTier = m.tier;
                }
            },
            onDestroy: () => {
                releaseBackHandler();
            },
        },
        msgBroker: {
            subscribe: {
                'APP.LAYOUT.CHANGED': {
                    in: {
                        callback: (msg) => {
                            if (msg.payload?.tier && !m.tier) {
                                m.currentTier = msg.payload.tier;
                            }
                        },
                    },
                },
            },
        },
        view: () => {
            return <c.children.Dialog />;
        },
    };

    c = useComponent(def, params) as Component<ImplStruct>;
    m = c.model;

    return c as Component<AdaptiveDialogStruct>;
};

export const AdaptiveDialog = toReact(useAdaptiveDialog);
