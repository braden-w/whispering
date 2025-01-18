<script lang="ts" generics="TData">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { Table } from '@tanstack/svelte-table';

	let { table }: { table: Table<TData> } = $props();

	const currentPageCount = $derived(table.getRowModel().rows.length);
	const totalRowCount = $derived(table.getCoreRowModel().rows.length);

	const selectedRowsCount = $derived(
		table.getFilteredSelectedRowModel().rows.length,
	);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="flex items-center gap-2"
		aria-label="Selection options"
	>
		<Checkbox
			checked={selectedRowsCount > 0}
			indeterminate={selectedRowsCount > 0 && selectedRowsCount < totalRowCount}
			aria-label="Selection options"
		/>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start">
		{#if !table.getIsAllPageRowsSelected() || table.getIsAllRowsSelected()}
			<DropdownMenu.Item
				onclick={() => {
					table.toggleAllRowsSelected(false);
					table.toggleAllPageRowsSelected(true);
				}}
			>
				Select this page ({currentPageCount} items)
			</DropdownMenu.Item>
		{/if}
		{#if !table.getIsAllRowsSelected()}
			<DropdownMenu.Item
				onclick={() => {
					table.toggleAllRowsSelected(true);
				}}
			>
				Select all ({totalRowCount} items)
			</DropdownMenu.Item>
		{/if}
		{#if selectedRowsCount > 0}
			<DropdownMenu.Item
				onclick={() => {
					table.toggleAllRowsSelected(false);
				}}
			>
				Clear selection
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
