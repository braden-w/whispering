<script lang="ts">
	import * as ToggleGroup from '@repo/ui/toggle-group';
	import { Skeleton } from '@repo/ui/skeleton';
	import { MessageSquare, Lightbulb, Code } from 'lucide-svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';

	let {
		workspaceConfig,
		value = $bindable(),
		onModeChange,
		class: className,
	}: {
		workspaceConfig: WorkspaceConfig;
		value?: string;
		onModeChange?: (mode: string) => void;
		class?: string;
	} = $props();

	// Create query for modes
	const modesQuery = createQuery(
		rpc.modes.getModes(() => workspaceConfig).options,
	);

	const modes = $derived(modesQuery.data ?? []);

	// Get icon for mode
	function getModeIcon(modeName: string) {
		switch (modeName) {
			case 'plan':
				return Lightbulb;
			case 'build':
				return Code;
			default:
				return MessageSquare;
		}
	}
</script>

{#if modesQuery.isPending}
	<div class="flex items-center gap-1">
		<Skeleton class="h-9 w-[200px]" />
	</div>
{:else if modesQuery.isError}
	<div class="text-sm text-destructive">Failed to load modes</div>
{:else}
	<ToggleGroup.Root
		type="single"
		{value}
		onValueChange={(newValue) => {
			if (newValue) {
				value = newValue;
				onModeChange?.(newValue);
			}
		}}
		class={className}
	>
		{#each modes as mode (mode.name)}
			{@const Icon = getModeIcon(mode.name)}
			<ToggleGroup.Item value={mode.name} aria-label="{mode.name} mode">
				<Icon class="size-4 mr-2" />
				{mode.name}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
{/if}
