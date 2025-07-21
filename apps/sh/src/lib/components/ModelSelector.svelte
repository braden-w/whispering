<script lang="ts">
	import type { Provider } from '$lib/client/types.gen';
	import { Button } from '@repo/ui/button';
	import * as Command from '@repo/ui/command';
	import { useCombobox } from '@repo/ui/hooks';
	import * as Popover from '@repo/ui/popover';
	import { cn } from '@repo/ui/utils';
	import { CheckIcon, ChevronsUpDownIcon } from 'lucide-svelte';

	let {
		providers = [],
		value = $bindable<{ providerId: string; modelId: string } | null>(null),
		placeholder = 'Select a model...',
		class: className,
	}: {
		providers?: Provider[];
		value?: { providerId: string; modelId: string } | null;
		placeholder?: string;
		class?: string;
	} = $props();

	const combobox = useCombobox();

	// Find the currently selected model display name
	const selectedDisplay = $derived.by(() => {
		if (!value) return null;
		
		const provider = providers.find(p => p.id === value?.providerId);
		if (!provider) return null;
		
		const model = provider.models[value.modelId];
		if (!model) return null;
		
		return `${model.name} (${provider.name})`;
	});

	function handleSelect(providerId: string, modelId: string) {
		value = { providerId, modelId };
		combobox.closeAndFocusTrigger();
	}
</script>

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class={cn('justify-between', className)}
				role="combobox"
				aria-expanded={combobox.open}
			>
				{selectedDisplay ?? placeholder}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[300px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search models..." />
			<Command.List class="max-h-[400px] overflow-y-auto">
				<Command.Empty>No models found.</Command.Empty>
				
				{#each providers as provider (provider.id)}
					<Command.Group heading={provider.name}>
						{#each Object.entries(provider.models) as [modelId, model] (modelId)}
							{@const isSelected = value?.providerId === provider.id && value?.modelId === modelId}
							<Command.Item
								value={`${provider.id}:${modelId}`}
								onSelect={() => handleSelect(provider.id, modelId)}
								class="flex items-center gap-2"
							>
								<CheckIcon
									class={cn(
										'size-4 shrink-0',
										!isSelected && 'text-transparent'
									)}
								/>
								<div class="flex flex-col gap-0.5">
									<span class="font-medium">{model.name}</span>
									<span class="text-xs text-muted-foreground">
										Released: {new Date(model.release_date).toLocaleDateString()}
									</span>
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>