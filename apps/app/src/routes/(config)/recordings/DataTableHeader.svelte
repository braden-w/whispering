<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Recording } from '$lib/services/db/recordings.svelte';
	import type { HeaderContext } from '@tanstack/table-core';
	import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-svelte';

	let { column }: HeaderContext<Recording, unknown> = $props();
	let headerText = $derived(column.columnDef.meta?.headerText);
</script>

<Button
	variant="ghost"
	onclick={() => {
		column.toggleSorting();
	}}
>
	{headerText}
	{#if column.getIsSorted() === 'asc'}
		<ArrowUpIcon class="ml-2 h-4 w-4" />
	{:else if column.getIsSorted() === 'desc'}
		<ArrowDownIcon class="ml-2 h-4 w-4" />
	{:else}
		<ArrowUpDownIcon class="ml-2 h-4 w-4" />
	{/if}
</Button>
