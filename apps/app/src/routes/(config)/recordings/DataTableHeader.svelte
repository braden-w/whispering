<script lang="ts">
import type { Recording } from '$lib/services/RecordingDbService';
import type { HeaderContext } from '@tanstack/table-core';

const { column }: HeaderContext<Recording, unknown> = $props();
const headerText = $derived(column.columnDef.meta?.headerText);
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
