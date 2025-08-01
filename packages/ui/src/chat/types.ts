/*
	Installed from @ieedan/shadcn-svelte-extras
*/

import type { WithChildren, WithoutChildren } from 'bits-ui';
import type { HTMLAttributes } from 'svelte/elements';

export type ChatBubbleMessageProps = ChatBubbleMessagePropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;

export type ChatBubbleMessagePropsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
	typing?: boolean;
}>;

export type ChatBubbleProps = ChatBubblePropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;

export type ChatBubblePropsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
	variant: 'received' | 'sent';
}>;

export type ChatListProps = ChatListPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;

export type ChatListPropsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
}>;
