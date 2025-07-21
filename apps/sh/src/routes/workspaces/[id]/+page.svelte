<script lang="ts">
	import WorkspaceConnectionBadge from '$lib/components/WorkspaceConnectionBadge.svelte';
	import { Badge } from '@repo/ui/badge';
	import * as Breadcrumb from '@repo/ui/breadcrumb';
	import { Button } from '@repo/ui/button';
	import { ChevronRight } from 'lucide-svelte';
	import CreateSessionModal from './_components/CreateSessionModal.svelte';
	import SessionList from './_components/SessionList.svelte';

	const { data } = $props();

	const workspaceConfig = $derived(data.workspaceConfig);
	const sessions = $derived(data.sessions);

	let createDialogOpen = $state(false);
</script>

{#if workspaceConfig}
	<!-- Breadcrumb Section -->
	<header class="border-b flex h-14 items-center px-4 sm:px-6">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/workspaces">Workspaces</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator>
					<ChevronRight class="h-4 w-4" />
				</Breadcrumb.Separator>
				<Breadcrumb.Item>
					<Breadcrumb.Page>{workspaceConfig.name}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</header>

	<!-- Page Content -->
	<div class="px-4 sm:px-6 py-6 sm:py-8">
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">{workspaceConfig.name}</h1>
					<p class="text-muted-foreground">
						Manage sessions for this workspace
					</p>
				</div>
				<div class="flex items-center gap-4">
					<WorkspaceConnectionBadge workspaceConfig={workspaceConfig} />
						<Badge variant="secondary" class="text-sm">
							{sessions.length} session{sessions.length !== 1 ? 's' : ''}
						</Badge>
					<Button onclick={() => (createDialogOpen = true)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="mr-2"
						>
							<path d="M12 5v14M5 12h14" />
						</svg>
						Create New Session
					</Button>
				</div>
			</div>

				<SessionList
					sessions={sessions}
					workspaceConfig={workspaceConfig}
				/>
		</div>
	</div>

	{#if workspaceConfig}
		<CreateSessionModal bind:open={createDialogOpen} {workspaceConfig} />
	{/if}
{/if}
