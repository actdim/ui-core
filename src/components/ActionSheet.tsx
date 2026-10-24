import React, { useRef } from 'react';
import {
    type Component,
    type ComponentDef,
    type ComponentModel,
    type ComponentParams,
    type ComponentStruct,
} from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { bindProp } from '@actdim/dynstruct/componentModel/core';
import { useDrawer, type DrawerStruct } from '@actdim/dynstruct-mui';
import { type BaseAppMsgStruct, type BaseAppMsgChannels } from '@actdim/dynstruct/appDomain/appContracts';
import { handleNavLinkClick } from '@actdim/dynstruct/services/react/NavLink';
import { registerBackHandler, unregisterBackHandler } from '../layout/BackStackService';
import { themeVar, tw } from '../theme/tw';
import { useT } from '../i18n/useT';
import { type MessageDescriptor } from '../i18n/i18nTypes';

export type MenuItemAction = {
    id: string;
    label: React.ReactNode | MessageDescriptor;
    // a string is an icon class list (`'iconify tabler--upload'`), anything else is rendered as is
    icon?: React.ReactNode;
    danger?: boolean;
    dangerous?: boolean;
    disabled?: boolean;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
    /** Route link: rendered as `<a href>`; a plain click navigates in place, modified / middle click opens natively */
    href?: string;
};

export type ActionSheetProps = {
    open: boolean;
    onClose?: () => void;
    title?: React.ReactNode | MessageDescriptor;
    actions: MenuItemAction[];
};

export function renderMenuIcon(icon: React.ReactNode): React.ReactNode {
    if (typeof icon === 'string') {
        // runtime icon class list supplied by the caller
        return <span className={icon} />;
    }

    return icon;
}

function isMessageDescriptor(val: unknown): val is MessageDescriptor {
    return (
        typeof val === 'object' &&
        val !== null &&
        'key' in val &&
        typeof (val as Record<string, unknown>).key === 'string'
    );
}

export function resolveDescriptorOrNode(
    val: React.ReactNode | MessageDescriptor | undefined,
    t: (key: string, params?: Record<string, unknown>) => string,
): React.ReactNode {
    if (isMessageDescriptor(val)) {
        return t(val.key, val.params) || val.fallback || val.key;
    }

    return val;
}

// Closing sets `open` to false: a parent observes it through a two-way binding of `open`
// (`bindProp` / `bind(get, set)`; a React parent: `$events.onChangeOpen`).
export type ActionSheetStruct<TMsg extends BaseAppMsgStruct = BaseAppMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: {
            open: boolean;
            onClose?: () => void;
            title?: React.ReactNode | MessageDescriptor;
            actions: MenuItemAction[];
        };
        actions: {
            close: () => void;
        };
        children: {
            drawer: DrawerStruct;
            drawerContent: React.FC;
        };
        effects: 'backHandler';
        msgScope: {
            // href actions navigate through the bus
            publish: BaseAppMsgChannels<'APP.NAV.GOTO'>;
        };
    }
>;

export const useActionSheet = (params: ComponentParams<ActionSheetStruct>): Component<ActionSheetStruct> => {
    let c: Component<ActionSheetStruct>;
    let m: ComponentModel<ActionSheetStruct>;

    const t = useT('ui-core');
    const defaultBackHandlerId = React.useId();

    // id of the registered back handler while the sheet is open
    const backHandlerIdRef = useRef<string | null>(null);
    const releaseBackHandler = () => {
        if (backHandlerIdRef.current) {
            unregisterBackHandler(backHandlerIdRef.current);
            backHandlerIdRef.current = null;
        }
    };

    const def: ComponentDef<ActionSheetStruct> = {
        props: {
            open: false,
            onClose: undefined,
            title: undefined,
            actions: [],
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
            drawer: useDrawer({
                anchor: 'bottom',
                open: bindProp(() => m, 'open'),
                onClose: () => {
                    m.close();
                },
                sx: {
                    '& .MuiDrawer-paper': {
                        borderTopLeftRadius: themeVar('radius', 'dialog'),
                        borderTopRightRadius: themeVar('radius', 'dialog'),
                        backgroundColor: themeVar('color', 'surface-dialog'),
                        color: themeVar('color', 'fg-default'),
                        maxHeight: '80vh',
                        pb: `calc(env(safe-area-inset-bottom, 0px) + ${themeVar('spacing', 'normal')})`,
                    },
                },
                // a fragment child is rendered as an observer: title / actions stay live while the sheet is open
                children: () => <c.children.DrawerContent />,
            }),
            drawerContent: () => {
                const titleContent = resolveDescriptorOrNode(m.title, t);

                return (
                    <div className={tw('flex flex-col')}>
                        <div className={tw('w-full flex items-center justify-center pt-normal pb-tight')}>
                            <div className={tw('w-control-md h-tight bg-line-strong rounded-full')} />
                        </div>

                        {titleContent && (
                            <div className={tw('px-relaxed py-snug border-b border-line-default text-caption font-strong text-fg-muted truncate')}>
                                {titleContent}
                            </div>
                        )}

                        <div className={tw('py-tight')}>
                            {m.actions.map((action) => {
                                const isDanger = Boolean(action.danger || action.dangerous);
                                const labelContent = resolveDescriptorOrNode(action.label, t);
                                const className = tw('w-full min-h-control-lg px-loose flex items-center gap-normal text-left transition hover:bg-surface-hover disabled:opacity-disabled disabled:cursor-not-allowed', isDanger ? 'text-danger' : 'text-fg-default');
                                const content = (
                                    <>
                                        {action.icon && (
                                            <span className={tw('text-title shrink-0', isDanger ? 'text-danger' : 'text-fg-muted')}>
                                                {renderMenuIcon(action.icon)}
                                            </span>
                                        )}
                                        <span className={tw('text-label truncate')}>
                                            {labelContent}
                                        </span>
                                    </>
                                );

                                if (action.href && !action.disabled) {
                                    return (
                                        <a
                                            key={action.id}
                                            href={action.href}
                                            onClick={(e) => {
                                                action.onClick?.(e);
                                                handleNavLinkClick(e, c.msgBus, action.href);
                                                m.close();
                                            }}
                                            className={className}
                                        >
                                            {content}
                                        </a>
                                    );
                                }

                                return (
                                    <button
                                        key={action.id}
                                        type='button'
                                        disabled={action.disabled}
                                        onClick={(e) => {
                                            action.onClick?.(e);
                                            m.close();
                                        }}
                                        className={className}
                                    >
                                        {content}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            },
        },
        effects: {
            // auto-tracked: works when the sheet is a def child (the host does not re-render on `open`)
            backHandler: () => {
                if (!m.open) {
                    releaseBackHandler();

                    return;
                }
                if (backHandlerIdRef.current) {
                    return;
                }
                const id = `action-sheet-${defaultBackHandlerId}`;
                backHandlerIdRef.current = id;
                registerBackHandler({
                    id,
                    priority: 100,
                    handle: () => {
                        m.close();

                        return true;
                    },
                });
            },
        },
        events: {
            onDestroy: () => {
                releaseBackHandler();
            },
        },
        view: () => {
            return <c.children.Drawer />;
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export const ActionSheet = toReact(useActionSheet);
