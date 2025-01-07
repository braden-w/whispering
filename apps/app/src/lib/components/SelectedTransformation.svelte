<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { createTransformationsQuery } from '$lib/queries/transformations';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import {
		CheckIcon,
		ChevronsUpDownIcon,
		CircleIcon,
		SettingsIcon,
	} from 'lucide-svelte';
	import { tick } from 'svelte';

	const transformationsQuery = createTransformationsQuery();

	const transformationsWithNonemptyTitle = $derived(
		transformationsQuery.data
			? transformationsQuery.data.filter((t) => t.title.trim() !== '')
			: [],
	);

	const displayTransformation = $derived(
		transformationsWithNonemptyTitle.find(
			(t) =>
				t.id === settings.value['transformations.selectedTransformationId'],
		),
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

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-full justify-between"
				{...props}
			>
				{displayTransformation?.title ?? 'No post-processing selected'}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<Command.Root>
			<Command.Input placeholder="Search transformations..." />
			<Command.Empty>No transformation found.</Command.Empty>
			<Command.Group>
				<Command.Item
					value="None"
					onSelect={() => {
						settings.value = {
							...settings.value,
							'transformations.selectedTransformationId': null,
						};
						closeAndFocusTrigger();
					}}
				>
					<CircleIcon class="h-4 w-4" />
					None
				</Command.Item>
				{#each transformationsWithNonemptyTitle as transformation (transformation.id)}
					<Command.Item
						value={transformation.title}
						onSelect={() => {
							settings.value = {
								...settings.value,
								'transformations.selectedTransformationId': transformation.id,
							};
							closeAndFocusTrigger();
						}}
						class="line-clamp-1 flex items-center"
					>
						<CheckIcon
							class={cn(
								settings.value['transformations.selectedTransformationId'] !==
									transformation.id && 'text-transparent',
							)}
						/>
						{transformation.title}
					</Command.Item>
				{/each}
				<Command.Item
					value="Manage transformations"
					onSelect={() => goto('/transformations')}
				>
					<SettingsIcon class="h-4 w-4" />
					Manage transformations
				</Command.Item>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
