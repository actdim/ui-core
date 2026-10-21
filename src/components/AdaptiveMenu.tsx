import React, { useRef } from 'react';
import {
    type Component,
    type ComponentDef,
    type ComponentModel,
    type ComponentParams,
    type ComponentStruct,
} from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { bind } from '@actdim/dynstruct/componentModel/core';
import { useMenu, type MenuStruct } from '@actdim/dynstruct-mui';
import { type MenuItemDef } from '@actdim/dynstruct-mui/Menu';
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';
import { type LayoutTier } from '../layout/layoutTypes';
import { registerBackHandler, unregisterBackHandler } from '../layout/BackStackService';
import {
    renderMenuIcon,
    resolveDescriptorOrNode,
    useActionSheet,
    type ActionSheetStruct,
    type MenuItemAction,
} from './ActionSheet';
import { themeVar, tw } from '../theme/tw';
import { useT } from '../i18n/useT';
import { type MessageDescriptor } from '../i18n/i18nTypes';

export { type MenuItemAction } from './ActionSheet';

export type AdaptiveMenuProps = {
    open: boolean;
    onClose?: () => void;
    tier: LayoutTier;
    anchorEl?: HTMLElement | null;
    anchorPosition?: { top: number; left: number };
    title?: React.ReactNode | MessageDescriptor;
    actions: MenuItemAction[];
};

// Closing sets `open` to false: a parent observes it through a two-way binding of `open`
// (`bindProp` / `bind(get, set)`; a React parent: `$events.onChangeOpen` or direct `onClose`).
export type AdaptiveMenuStruct<TMsg extends BaseAppMsgStruct = BaseAppMsgStruct> = ComponentStruct<
    TMsg,
    {
        props: {
            open: boolean;
            onClose?: () => void;
            tier: LayoutTier;
            anchorEl?: HTMLElement | null;
            anchorPosition?: { top: number; left: number };
            title?: React.ReactNode | MessageDescriptor;
            actions: MenuItemAction[];
        };
        actions: {
            close: () => void;
        };
        children: {
            actionSheet: ActionSheetStruct<TMsg>;
            menu: MenuStruct;
        };
        effects: 'backHandler';
    }
>;

export const useAdaptiveMenu = (params: ComponentParams<AdaptiveMenuStruct>): Component<AdaptiveMenuStruct> => {
    let c: Component<AdaptiveMenuStruct>;
    let m: ComponentModel<AdaptiveMenuStruct>;

    const t = useT('ui-core');
    const defaultBackHandlerId = React.useId();

    // id of the registered back handler while the menu is open
    const backHandlerIdRef = useRef<string | null>(null);
    const releaseBackHandler = () => {
        if (backHandlerIdRef.current) {
            unregisterBackHandler(backHandlerIdRef.current);
            backHandlerIdRef.current = null;
        }
    };

    const def: ComponentDef<AdaptiveMenuStruct> = {
        props: {
            open: false,
            onClose: undefined,
            tier: 'expanded',
            anchorEl: null,
            anchorPosition: undefined,
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
            actionSheet: useActionSheet({
                open: bind(() => m.open && m.tier === 'compact'),
                onClose: () => {
                    m.close();
                },
                title: bind(() => m.title),
                actions: bind(() => m.actions),
            }),
            menu: useMenu({
                open: bind(() => m.open && m.tier !== 'compact'),
                anchorEl: bind(() => m.anchorEl),
                anchorPosition: bind(() => m.anchorPosition),
                onClose: () => {
                    m.close();
                },
                items: bind(() => {
                    const list: MenuItemDef[] = [];
                    const titleContent = resolveDescriptorOrNode(m.title, t);
                    if (titleContent) {
                        list.push({
                            id: '__title',
                            label: (
                                <span className={tw('text-caption font-strong text-fg-faint block truncate max-w-popup')}>
                                    {titleContent}
                                </span>
                            ),
                            disabled: true,
                            divider: true,
                        });
                    }

                    for (const action of m.actions) {
                        const isDanger = Boolean(action.danger || action.dangerous);
                        const labelContent = resolveDescriptorOrNode(action.label, t);
                        list.push({
                            id: action.id,
                            label: (
                                <span className={tw(isDanger ? 'text-danger' : 'text-fg-default')}>
                                    {labelContent}
                                </span>
                            ),
                            icon: renderMenuIcon(action.icon),
                            disabled: action.disabled,
                            onClick: () => {
                                action.onClick();
                                m.close();
                            },
                        });
                    }

                    return list;
                }),
                sx: {
                    '& .MuiPaper-root': {
                        minWidth: themeVar('container', 'popup'),
                        backgroundColor: themeVar('color', 'surface-popup'),
                        color: themeVar('color', 'fg-default'),
                        borderRadius: themeVar('radius', 'popup'),
                        boxShadow: themeVar('shadow', 'popup'),
                        border: `${themeVar('borderWidth', 'thin')} solid ${themeVar('color', 'line-default')}`,
                    },
                },
            }),
        },
        effects: {
            // auto-tracked: works when the menu is a def child (the host does not re-render on `open`);
            // on the compact tier the action sheet registers its own handler
            backHandler: () => {
                if (!m.open || m.tier === 'compact') {
                    releaseBackHandler();

                    return;
                }
                if (backHandlerIdRef.current) {
                    return;
                }
                const id = `menu-${defaultBackHandlerId}`;
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
            if (m.tier === 'compact') {
                return <c.children.ActionSheet />;
            }

            return <c.children.Menu />;
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export const AdaptiveMenu = toReact(useAdaptiveMenu);
