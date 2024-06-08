<script lang="ts">
	import type { Recording } from '$lib/services/RecordingDbService';
	import { Button } from '@repo/ui/components/button';
	import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from '@repo/ui/icons';
	import type { HeaderContext } from '@tanstack/table-core';

	let { column }: HeaderContext<Recording, unknown> = $props();
	let headerText = $derived(column.columnDef.meta?.headerText);
</script>

<Button
	variant="ghost"
	on:click={() => {
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
