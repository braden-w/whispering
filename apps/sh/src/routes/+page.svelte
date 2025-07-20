<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import SessionList from '$lib/components/SessionList.svelte';
	// import CreateSessionDialog from '$lib/components/CreateSessionDialog.svelte';
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';

	const sessionsQuery = createQuery(rpc.sessions.getSessions.options);
	let createDialogOpen = $state(false);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Sessions</h1>
			<p class="text-muted-foreground">
				Manage your OpenCode conversation sessions
			</p>
		</div>
		<div class="flex items-center gap-4">
			{#if sessionsQuery.data}
				<Badge variant="secondary" class="text-sm">
					{sessionsQuery.data.length} session{sessionsQuery.data.length !== 1
						? 's'
						: ''}
				</Badge>
			{/if}
			<Button onclick={() => (createDialogOpen = true)}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mr-2"
				>
					<path d="M12 5v14M5 12h14" />
				</svg>
				Create New Session
			</Button>
		</div>
	</div>

	<SessionList
		sessions={sessionsQuery.data || []}
		isLoading={sessionsQuery.isLoading}
	/>
</div>

<!-- <CreateSessionDialog bind:open={createDialogOpen} /> -->
