<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { createTransformationsQuery } from '$lib/queries/transformations';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import { CheckIcon, ChevronsUpDownIcon } from 'lucide-svelte';
	import { tick } from 'svelte';

	const transformationsQuery = createTransformationsQuery();

	const displayTransformationTitle = $derived(
		transformationsQuery.data?.find(
			(t) =>
				t.id === settings.value['transformations.selectedTransformationId'],
		)?.title,
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
				{displayTransformationTitle ?? 'No post-processing selected'}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<Command.Root>
			<Command.Input placeholder="Search transformations..." />
			<Command.Empty>No transformation found.</Command.Empty>
			<Command.Group>
				{#each transformationsQuery.data ?? [] as transformation (transformation.id)}
					<Command.Item
						value={transformation.title}
						onSelect={() => {
							settings.value = {
								...settings.value,
								'transformations.selectedTransformationId': transformation.id,
							};
							closeAndFocusTrigger();
						}}
					>
						<CheckIcon
							class={cn(
								settings.value['transformations.selectedTransformationId'] !==
									transformation.id && 'text-transparent',
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
	</Popover.Content>
</Popover.Root>
