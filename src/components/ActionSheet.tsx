import React from 'react';
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
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';
import { registerBackHandler, unregisterBackHandler } from '../layout/BackStackService';
import { themeVar, tw } from '../theme/tw';

export type MenuItemAction = {
    id: string;
    label: string;
    // a string is an icon class list (`'iconify tabler--upload'`), anything else is rendered as is
    icon?: React.ReactNode;
    danger?: boolean;
    dangerous?: boolean;
    disabled?: boolean;
    onClick: () => void;
};

export type ActionSheetProps = {
    open: boolean;
    onClose?: () => void;
    title?: string;
    actions: MenuItemAction[];
};

export function renderMenuIcon(icon: React.ReactNode): React.ReactNode {
    if (typeof icon === 'string') {
        // runtime icon class list supplied by the caller
        return <span className={icon} />;
    }

    return icon;
}

// Closing sets `open` to false: a parent observes it through a two-way binding of `open`
// (`bindProp` / `bind(get, set)`; a React parent: `$events.onChangeOpen`).
export type ActionSheetStruct<TMsg extends BaseAppMsgStruct = BaseAppMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: {
            open: boolean;
            onClose?: () => void;
            title?: string;
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
    }
>;

export const useActionSheet = (params: ComponentParams<ActionSheetStruct>): Component<ActionSheetStruct> => {
    let c: Component<ActionSheetStruct>;
    let m: ComponentModel<ActionSheetStruct>;

    // id of the registered back handler while the sheet is open (effects ignore a returned cleanup)
    let backHandlerId: string | null = null;
    const releaseBackHandler = () => {
        if (backHandlerId) {
            unregisterBackHandler(backHandlerId);
            backHandlerId = null;
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
                return (
                    <div className={tw('flex flex-col')}>
                        <div className={tw('w-full flex items-center justify-center pt-normal pb-tight')}>
                            <div className={tw('w-control-md h-tight bg-line-strong rounded-full')} />
                        </div>

                        {m.title && (
                            <div className={tw('px-relaxed py-snug border-b border-line-default text-caption font-strong text-fg-muted truncate')}>
                                {m.title}
                            </div>
                        )}

                        <div className={tw('py-tight')}>
                            {m.actions.map((action) => {
                                const isDanger = Boolean(action.danger || action.dangerous);

                                return (
                                    <button
                                        key={action.id}
                                        type='button'
                                        disabled={action.disabled}
                                        onClick={() => {
                                            action.onClick();
                                            m.close();
                                        }}
                                        className={tw('w-full min-h-control-lg px-loose flex items-center gap-normal text-left transition hover:bg-surface-hover disabled:opacity-disabled disabled:cursor-not-allowed', isDanger ? 'text-danger' : 'text-fg-default')}
                                    >
                                        {action.icon && (
                                            <span className={tw('text-title shrink-0', isDanger ? 'text-danger' : 'text-fg-muted')}>
                                                {renderMenuIcon(action.icon)}
                                            </span>
                                        )}
                                        <span className={tw('text-label truncate')}>
                                            {action.label}
                                        </span>
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
                if (backHandlerId) {
                    return;
                }
                backHandlerId = `action-sheet-${Math.random().toString(36).slice(2, 9)}`;
                registerBackHandler({
                    id: backHandlerId,
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
