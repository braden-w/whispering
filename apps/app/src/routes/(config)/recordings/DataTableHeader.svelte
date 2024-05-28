<script lang="ts">
	import type { Recording } from '@repo/services/services/recordings-db';
	import { Button } from '@repo/ui/components/button';
	import type { HeaderContext } from '@tanstack/table-core';
	import ArrowDown from '~icons/lucide/arrow-down';
	import ArrowUp from '~icons/lucide/arrow-up';
	import ArrowUpDown from '~icons/lucide/arrow-up-down';

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
		<ArrowUp class="ml-2 h-4 w-4" />
	{:else if column.getIsSorted() === 'desc'}
		<ArrowDown class="ml-2 h-4 w-4" />
	{:else}
		<ArrowUpDown class="ml-2 h-4 w-4" />
	{/if}
</Button>
