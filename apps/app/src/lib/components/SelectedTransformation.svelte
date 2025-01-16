<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { useTransformationsQuery } from '$lib/query/transformations/queries';
	import type { Transformation } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import { createTransformationViewTransitionName } from '$lib/utils/createTransformationViewTransitionName';
	import { CheckIcon, ChevronsUpDownIcon, SettingsIcon } from 'lucide-svelte';
	import { tick } from 'svelte';
	import { Badge } from './ui/badge';

	const transformationsQuery = useTransformationsQuery();

	const transformations = $derived(transformationsQuery.data ?? []);

	const displayTransformation = $derived(
		transformations.find(
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

{#snippet renderTransformationIdTitle(transformation: Transformation)}
	<div class="flex items-center gap-2">
		<Badge variant="id" class="flex-shrink-0 max-w-16 truncate">
			{transformation.id}
		</Badge>
		<span class="font-medium truncate">
			{transformation.title}
		</span>
	</div>
{/snippet}

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-full justify-between"
				{...props}
				style="view-transition-name: {createTransformationViewTransitionName({
					transformationId: displayTransformation?.id ?? null,
				})}"
			>
				{#if displayTransformation}
					{@render renderTransformationIdTitle(displayTransformation)}
				{:else}
					No post-processing selected
				{/if}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<Command.Root loop>
			<Command.Input placeholder="Search transformations..." />
			<Command.Empty>No transformation found.</Command.Empty>
			<Command.Group>
				{#each transformations as transformation (transformation.id)}
					<Command.Item
						value="${transformation.id} - ${transformation.title} - ${transformation.description}"
						onSelect={() => {
							if (
								settings.value['transformations.selectedTransformationId'] ===
								transformation.id
							) {
								settings.value = {
									...settings.value,
									'transformations.selectedTransformationId': null,
								};
							} else {
								settings.value = {
									...settings.value,
									'transformations.selectedTransformationId': transformation.id,
								};
							}
							closeAndFocusTrigger();
						}}
						class="flex items-center gap-1 py-3"
					>
						<CheckIcon
							class={cn(
								'h-4 w-4 flex-shrink-0',
								settings.value['transformations.selectedTransformationId'] !==
									transformation.id && 'text-transparent',
							)}
						/>
						<div class="flex flex-col min-w-0">
							{@render renderTransformationIdTitle(transformation)}
							{#if transformation.description}
								<span class="text-sm text-muted-foreground line-clamp-2">
									{transformation.description}
								</span>
							{/if}
						</div>
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
