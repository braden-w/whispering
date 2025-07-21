<script lang="ts">
	import { Skeleton } from '@repo/ui/skeleton';
	import SessionCard from './SessionCard.svelte';
	import type { Session } from '$lib/client/types.gen';
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';

	let {
		sessions,
		isLoading = false,
		workspaceConfig,
	}: {
		sessions: Session[];
		isLoading?: boolean;
		workspaceConfig?: WorkspaceConfig;
	} = $props();
</script>

{#if isLoading}
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each Array(6) as _}
			<div class="space-y-3">
				<Skeleton class="h-[125px] w-full rounded-xl" />
			</div>
		{/each}
	</div>
{:else if sessions.length === 0}
	<div class="flex flex-col items-center justify-center py-12 text-center">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-12 w-12 text-muted-foreground mb-4"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
			/>
		</svg>
		<h3 class="text-lg font-semibold">No sessions yet</h3>
		<p class="text-sm text-muted-foreground mt-1">
			Create your first session to get started
		</p>
	</div>
{:else}
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each sessions as session}
			<SessionCard {session} {workspaceConfig} />
		{/each}
	</div>
{/if}
