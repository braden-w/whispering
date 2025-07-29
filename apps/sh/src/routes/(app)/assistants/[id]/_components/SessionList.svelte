<script lang="ts">
	import type { Session } from '$lib/client/types.gen';
	import type { AssistantConfig } from '$lib/stores/assistant-configs.svelte';

	import SessionTable from './SessionTable.svelte';

	let {
		assistantConfig,
		sessions,
	}: {
		assistantConfig: AssistantConfig;
		sessions: Session[];
	} = $props();
</script>

{#if sessions.length === 0}
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
	<SessionTable {sessions} {assistantConfig} />
{/if}
