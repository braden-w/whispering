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

	let selectedTransformationId = $state<Transformation['id'] | null>(null);

	let open = $state(false);
	let searchQuery = $state('');
	const transformationsQuery = createTransformationsQuery();
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-full justify-between"
				{...props}
			>
				{selectedTransformationId ?? 'No post-processing selected'}
				<ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-full p-0">
		<Command.Root>
			<Command.Input
				placeholder="Search transformations..."
				bind:value={searchQuery}
			/>
			<Command.Empty>No transformation found.</Command.Empty>
			<Command.Group>
				{#if transformationsQuery.data}
					{#each transformationsQuery.data.filter((t) => t.title
								.toLowerCase()
								.includes(searchQuery.toLowerCase()) || t.description
								.toLowerCase()
								.includes(searchQuery.toLowerCase())) as transformation (transformation.id)}
						<Command.Item
							value={transformation.title}
							onSelect={() => {
								selectedTransformationId = transformation.id;
								open = false;
							}}
							class="cursor-pointer"
						>
							<CheckIcon
								class={cn(
									'mr-2 h-4 w-4',
									selectedTransformationId === transformation.id
										? 'opacity-100'
										: 'opacity-0',
								)}
							/>
							<div class="flex flex-col gap-1">
								<span>{transformation.title}</span>
								{#if transformation.description}
									<span class="text-muted-foreground text-sm">
										{transformation.description}
									</span>
								{/if}
							</div>
						</Command.Item>
					{/each}
				{/if}
			</Command.Group>
		</Command.Root>
	</PopoverContent>
</Popover>
