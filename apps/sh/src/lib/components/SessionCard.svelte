<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import * as Card from '@repo/ui/card';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import { formatDistanceToNow } from '$lib/utils/date';

	let {
		session,
		onDelete,
		onShare,
		onUnshare
	}: {
		session: Session;
		onDelete?: () => void;
		onShare?: () => void;
		onUnshare?: () => void;
	} = $props();

	const createdAt = $derived(new Date(session.time.created));
	const updatedAt = $derived(new Date(session.time.updated));
	const isShared = $derived(!!session.share?.url);
</script>

<Card.Root class="hover:shadow-md transition-shadow cursor-pointer">
	<a href="/session/{session.id}" class="block">
		<Card.Header>
			<div class="flex items-start justify-between">
				<div class="space-y-1">
					<Card.Title class="text-lg">
						{session.title || 'Untitled Session'}
					</Card.Title>
					<Card.Description>
						Created {formatDistanceToNow(createdAt)} ago
					</Card.Description>
				</div>
				{#if isShared}
					<Badge variant="secondary">Shared</Badge>
				{/if}
			</div>
		</Card.Header>
		<Card.Content>
			<div class="text-sm text-muted-foreground">
				Last updated {formatDistanceToNow(updatedAt)} ago
			</div>
		</Card.Content>
	</a>
	<Card.Footer class="flex justify-between">
		<div class="flex gap-2">
			{#if isShared}
				<Button
					size="sm"
					variant="outline"
					onclick={(e) => {
						e.preventDefault();
						onUnshare?.();
					}}
				>
					Unshare
				</Button>
			{:else}
				<Button
					size="sm"
					variant="outline"
					onclick={(e) => {
						e.preventDefault();
						onShare?.();
					}}
				>
					Share
				</Button>
			{/if}
		</div>
		<Button
			size="sm"
			variant="destructive"
			onclick={(e) => {
				e.preventDefault();
				onDelete?.();
			}}
		>
			Delete
		</Button>
	</Card.Footer>
</Card.Root>