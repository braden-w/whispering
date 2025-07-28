<script lang="ts">
	import type { AssistantConfig } from '$lib/stores/assistant-configs.svelte';

	import { goto } from '$app/navigation';
	import * as rpc from '$lib/query';
	import { assistantConfigs } from '$lib/stores/assistant-configs.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { Badge } from '@repo/ui/badge';
	import { badgeVariants } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import * as Table from '@repo/ui/table';
	import * as Tooltip from '@repo/ui/tooltip';
	import { createQuery } from '@tanstack/svelte-query';
	import { GitBranch } from 'lucide-svelte';

	import DeleteAssistantConfigButton from './DeleteAssistantConfigButton.svelte';
	import EditAssistantConfigButton from './EditAssistantConfigButton.svelte';
	import AssistantConnectionBadge from './AssistantConnectionBadge.svelte';

	let {
		columnVisibility,
		config,
	}: {
		columnVisibility: Record<string, boolean>;
		config: AssistantConfig;
	} = $props();

	const assistantQuery = createQuery(() => ({
		...rpc.assistants.getAssistant(() => config).options(),
		refetchInterval: 5000, // Refresh every 5 seconds
	}));

	function handleConnect() {
		// Update last used timestamp
		assistantConfigs.update(config.id, {});

		// Navigate to assistant sessions
		goto(`/assistants/${config.id}`);
	}

	const assistant = $derived(assistantQuery.data);
</script>

<Table.Row>
	{#if columnVisibility.name !== false}
		<Table.Cell class="font-medium">
			<div class="flex items-center gap-2">
				<Button
					variant="link"
					class="p-0"
					onclick={handleConnect}
					disabled={assistantQuery.isPending}
				>
					{config.name}
				</Button>
				{#if assistant?.connected && assistant.appInfo.git}
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger class={badgeVariants({ variant: 'secondary' })}>
								<GitBranch class="size-4" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Git repository detected</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				{/if}
			</div>
		</Table.Cell>
	{/if}
	{#if columnVisibility.port !== false}
		<Table.Cell>
			<Badge variant="secondary" class="text-xs font-mono">
				{config.port}
			</Badge>
		</Table.Cell>
	{/if}
	{#if columnVisibility.url !== false}
		<Table.Cell class="max-w-[200px] truncate">
			<code class="text-xs">{config.url}</code>
		</Table.Cell>
	{/if}
	{#if columnVisibility.rootPath !== false}
		<Table.Cell
			class="max-w-[200px] truncate"
			title={assistant?.connected ? assistant.appInfo.path.root : ''}
		>
			{#if assistant?.connected}
				<code class="text-xs">{assistant.appInfo.path.root}</code>
			{:else}
				<span class="text-muted-foreground">—</span>
			{/if}
		</Table.Cell>
	{/if}
	{#if columnVisibility.cwd !== false}
		<Table.Cell
			class="max-w-[200px] truncate"
			title={assistant?.connected ? assistant.appInfo.path.cwd : ''}
		>
			{#if assistant?.connected}
				<code class="text-xs">{assistant.appInfo.path.cwd}</code>
			{:else}
				<span class="text-muted-foreground">—</span>
			{/if}
		</Table.Cell>
	{/if}
	{#if columnVisibility.status !== false}
		<Table.Cell>
			<AssistantConnectionBadge assistantConfig={config} />
		</Table.Cell>
	{/if}
	{#if columnVisibility.lastUsed !== false}
		<Table.Cell>
			{formatDistanceToNow(new Date(config.lastAccessedAt))} ago
		</Table.Cell>
	{/if}
	{#if columnVisibility.actions !== false}
		<Table.Cell>
			<div class="flex items-center justify-end gap-2">
				<Button
					size="sm"
					variant="default"
					onclick={handleConnect}
					disabled={assistantQuery.isPending || !assistant?.connected}
				>
					{assistant?.connected ? 'Open' : 'Connect'}
				</Button>
				<EditAssistantConfigButton
					assistantConfig={config}
					disabled={assistantQuery.isPending}
				/>
				<DeleteAssistantConfigButton
					assistantConfig={config}
					disabled={assistantQuery.isPending}
				/>
			</div>
		</Table.Cell>
	{/if}
</Table.Row>
