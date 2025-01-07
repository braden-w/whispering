<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { createTransformationsQuery } from '$lib/queries/transformations';
	import { cn } from '$lib/utils';
	import { CheckIcon, ChevronsUpDownIcon } from 'lucide-svelte';
	import type { Transformation } from '$lib/services/db';
	import { tick } from 'svelte';

	let selectedTransformationId = $state<Transformation['id'] | null>(null);

	const transformationsQuery = createTransformationsQuery();

	const displayTransformationTitle = $derived(
		transformationsQuery.data?.find((t) => t.id === selectedTransformationId)
			?.title,
	);

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<Popover bind:open>
	<PopoverTrigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-full justify-between"
				{...props}
			>
				{displayTransformationTitle ?? 'No post-processing selected'}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-80 max-w-xl p-0">
		<Command.Root>
			<Command.Input placeholder="Search transformations..." />
			<Command.Empty>No transformation found.</Command.Empty>
			<Command.Group>
				{#each transformationsQuery.data ?? [] as transformation (transformation.id)}
					<Command.Item
						value={transformation.title}
						onSelect={() => {
							selectedTransformationId = transformation.id;
							closeAndFocusTrigger();
						}}
					>
						<CheckIcon
							class={cn(
								selectedTransformationId !== transformation.id &&
									'text-transparent',
							)}
						/>
						<div class="flex flex-col gap-1">
							{transformation.title}
							{#if transformation.description}
								<span class="text-muted-foreground text-sm">
									{transformation.description}
								</span>
							{/if}
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</PopoverContent>
</Popover>
