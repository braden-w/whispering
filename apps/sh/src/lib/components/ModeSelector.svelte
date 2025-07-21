<script lang="ts">
	import { Button } from '@repo/ui/button';
	import { cn } from '@repo/ui/utils';
	import { Skeleton } from '@repo/ui/skeleton';
	import { Settings as SettingsIcon } from 'lucide-svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import * as rpc from '$lib/query';
	import type { WorkspaceConfig } from '$lib/stores/workspace-configs.svelte';

	let {
		workspaceConfig,
		value = $bindable<string>('chat'),
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
		rpc.modes.getModes(() => workspaceConfig).options
	);

	const modes = $derived(modesQuery.data ?? []);

	// Check if a mode needs configuration (plan or build)
	function needsConfiguration(modeName: string): boolean {
		return modeName === 'plan' || modeName === 'build';
	}

	function handleModeSelect(modeName: string) {
		value = modeName;
		onModeChange?.(modeName);
	}
</script>

<div class={cn('flex items-center gap-1', className)}>
	{#if modesQuery.isPending}
		<div class="flex items-center gap-1">
			<Skeleton class="h-9 w-16" />
			<Skeleton class="h-9 w-16" />
			<Skeleton class="h-9 w-16" />
		</div>
	{:else if modesQuery.isError}
		<div class="text-sm text-destructive">
			Failed to load modes
		</div>
	{:else}
		{#each modes as mode (mode.name)}
			<Button
				variant={value === mode.name ? 'default' : 'outline'}
				size="sm"
				onclick={() => handleModeSelect(mode.name)}
				class="relative"
			>
				{mode.name}
				{#if needsConfiguration(mode.name)}
					<SettingsIcon class="size-3 ml-1" />
				{/if}
			</Button>
		{/each}
	{/if}
</div>