<script lang="ts">
	import { Button } from '@repo/ui/button';
	import * as Command from '@repo/ui/command';
	import { useCombobox } from '@repo/ui/hooks';
	import * as Popover from '@repo/ui/popover';
	import { cn } from '@repo/ui/utils';
	import { CheckIcon, ChevronsUpDownIcon } from 'lucide-svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';

	let {
		workspaceConfig,
		value = $bindable<{ providerId: string; modelId: string } | null>(null),
		placeholder = 'Select a model...',
		class: className,
	}: {
		workspaceConfig: WorkspaceConfig;
		value?: { providerId: string; modelId: string } | null;
		placeholder?: string;
		class?: string;
	} = $props();

	const combobox = useCombobox();

	// Create query for providers
	const providersQuery = createQuery(
		rpc.models.getProviders(() => workspaceConfig).options
	);

	const providers = $derived(providersQuery.data?.providers ?? []);

	// Find the currently selected model display name
	const selectedDisplayName = $derived.by(() => {
		if (!value) return null;
		
		const provider = providers.find(p => p.id === value?.providerId);
		if (!provider) return null;
		
		const model = provider.models[value.modelId];
		if (!model) return null;
		
		return `${model.name} (${provider.name})`;
	});
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
				{selectedDisplayName ?? placeholder}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[300px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search models..." />
			<Command.List class="max-h-[400px] overflow-y-auto">
				<Command.Empty>No models found.</Command.Empty>
				
				{#if providersQuery.isPending}
					<div class="p-4 text-center text-sm text-muted-foreground">
						Loading models...
					</div>
				{:else if providersQuery.isError}
					<div class="p-4 text-center text-sm text-destructive">
						Failed to load models
					</div>
				{:else}
					{#each providers as provider (provider.id)}
						<Command.Group heading={provider.name}>
							{#each Object.entries(provider.models) as [modelId, model] (modelId)}
								{@const isSelected = value?.providerId === provider.id && value?.modelId === modelId}
								<Command.Item
									value={`${provider.id}:${modelId}`}
									onSelect={() => {
										value = { providerId: provider.id, modelId };
										combobox.closeAndFocusTrigger();
									}}
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
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>