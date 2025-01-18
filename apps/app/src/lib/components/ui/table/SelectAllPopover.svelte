<script lang="ts" generics="TData">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import type { Table } from '@tanstack/svelte-table';

	let { table }: { table: Table<TData> } = $props();

	const currentPageCount = $derived(table.getRowModel().rows.length);
	const totalRowCount = $derived(table.getCoreRowModel().rows.length);
</script>

<Popover.Root>
	<Popover.Trigger
		class="flex items-center gap-2"
		aria-label="Selection options"
	>
		<Checkbox
			checked={table.getIsAllPageRowsSelected()}
			indeterminate={table.getIsSomePageRowsSelected() &&
				!table.getIsAllPageRowsSelected()}
			aria-label="Select rows"
		/>
	</Popover.Trigger>
	<Popover.Content class="w-[220px] p-0" align="start">
		<div class="grid gap-1 p-2">
			<Button
				variant="ghost"
				class="justify-start font-normal"
				onclick={() => table.toggleAllPageRowsSelected(true)}
			>
				Select this page ({currentPageCount} items)
			</Button>
			<Button
				variant="ghost"
				class="justify-start font-normal"
				onclick={() => table.toggleAllRowsSelected(true)}
			>
				Select all ({totalRowCount} items)
			</Button>
		</div>
	</Popover.Content>
</Popover.Root>
