<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import type { AssistantConfig } from '$lib/stores/assistant-configs.svelte';

	import { formatDistanceToNow } from '$lib/utils/date';
	import { Badge } from '@repo/ui/badge';
	import * as Table from '@repo/ui/table';

	import DeleteSessionButton from './DeleteSessionButton.svelte';
	import ShareSessionButton from './ShareSessionButton.svelte';

	let {
		assistantConfig,
		sessions,
	}: {
		assistantConfig: AssistantConfig;
		sessions: Session[];
	} = $props();

	function getSessionHref(session: Session) {
		return assistantConfig
			? `/assistants/${assistantConfig.id}/sessions/${session.id}`
			: `/session/${session.id}`;
	}

	function isShared(session: Session) {
		return !!session.share?.url;
	}
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Title</Table.Head>
				<Table.Head>Created</Table.Head>
				<Table.Head>Updated</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head class="text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each sessions as session}
				{@const createdAt = new Date(session.time.created)}
				{@const updatedAt = new Date(session.time.updated)}
				{@const shared = isShared(session)}
				<Table.Row class="hover:bg-muted/50">
					<Table.Cell class="font-medium">
						<a
							href={getSessionHref(session)}
							class="hover:underline text-foreground"
						>
							{session.title || 'Untitled Session'}
						</a>
					</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{formatDistanceToNow(createdAt)} ago
					</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{formatDistanceToNow(updatedAt)} ago
					</Table.Cell>
					<Table.Cell>
						{#if shared}
							<Badge variant="secondary">Shared</Badge>
						{:else}
							<span class="text-muted-foreground">—</span>
						{/if}
					</Table.Cell>
					<Table.Cell>
						<div class="flex items-center justify-end gap-2">
							<ShareSessionButton {session} {assistantConfig} />
							<DeleteSessionButton {session} {assistantConfig} />
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
