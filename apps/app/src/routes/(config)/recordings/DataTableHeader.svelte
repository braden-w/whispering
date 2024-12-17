<script lang="ts">
import {
	ArrowDownIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
} from '$lib/components/icons';
import { Button } from '$lib/components/ui/button/index.js';
import type { Recording } from '$lib/services/RecordingDbService';
import type { HeaderContext } from '@tanstack/table-core';

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
