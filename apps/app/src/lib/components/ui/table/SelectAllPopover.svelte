<script lang="ts" generics="TData">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { Table } from '@tanstack/svelte-table';

	let { table }: { table: Table<TData> } = $props();

	const currentPageCount = $derived(table.getRowModel().rows.length);
	const totalRowCount = $derived(table.getCoreRowModel().rows.length);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="flex items-center gap-2"
		aria-label="Selection options"
		onclick={() => {
			if (table.getIsSomePageRowsSelected()) {
				table.toggleAllPageRowsSelected(false);
			}
		}}
	>
		<Checkbox
			checked={table.getIsAllPageRowsSelected()}
			indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
			aria-label="Select rows"
		/>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="min-w-[220px]" align="start">
		<DropdownMenu.Item onclick={() => table.toggleAllPageRowsSelected(true)}>
			Select this page ({currentPageCount} items)
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => table.toggleAllRowsSelected(true)}>
			Select all ({totalRowCount} items)
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
