<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Table from '$lib/components/ui/table';
	import { createTransformationRunsByIdQuery } from '$lib/query/transformationRuns/queries';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { format } from 'date-fns';

	let { transformationId }: { transformationId: string } = $props();

	let expandedRunIds = new SvelteSet<string>();

	function toggleRunExpanded(runId: string) {
		if (expandedRunIds.has(runId)) {
			expandedRunIds.delete(runId);
		} else {
			expandedRunIds.add(runId);
		}
	}

	function formatDate(dateStr: string) {
		return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
	}

	const transformationsQuery = createTransformationRunsByIdQuery(
		() => transformationId,
	);
</script>

<div class="space-y-4 overflow-y-auto h-full">
	{#if transformationsQuery.isLoading}
		<div class="text-muted-foreground text-sm">Loading runs...</div>
	{:else if transformationsQuery.error}
		<div class="text-destructive text-sm">
			{transformationsQuery.error.description}
		</div>
	{:else if transformationsQuery.data}
		{@const runs = transformationsQuery.data}
		{#if runs.length === 0}
			<div class="text-muted-foreground text-sm">No runs yet</div>
		{:else}
			{#each runs as run}
				<Card.Root>
					<Card.Header class="p-4">
						<div class="flex items-center gap-6">
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 shrink-0"
								onclick={() => toggleRunExpanded(run.id)}
							>
								{#if expandedRunIds.has(run.id)}
									<ChevronDown class="h-4 w-4" />
								{:else}
									<ChevronRight class="h-4 w-4" />
								{/if}
							</Button>
							<div
								class="grid grid-cols-[100px_150px_150px] items-center gap-6"
							>
								<Badge variant={`status.${run.status}`} class="w-fit">
									{run.status}
								</Badge>
								<div class="text-sm text-muted-foreground whitespace-nowrap">
									{formatDate(run.startedAt)}
								</div>
								<div class="text-sm text-muted-foreground whitespace-nowrap">
									{run.completedAt ? formatDate(run.completedAt) : '-'}
								</div>
							</div>
						</div>
					</Card.Header>
					{#if expandedRunIds.has(run.id)}
						<Card.Content class="p-4">
							<div class="space-y-4">
								<div>
									<h4 class="text-sm font-medium mb-2">Input</h4>
									<pre
										class="text-sm bg-muted p-2 rounded-md overflow-x-auto">{run.input}</pre>
								</div>
								{#if run.output}
									<div>
										<h4 class="text-sm font-medium mb-2">Output</h4>
										<pre
											class="text-sm bg-muted p-2 rounded-md overflow-x-auto">{run.output}</pre>
									</div>
								{/if}
								{#if run.error}
									<div>
										<h4 class="text-sm font-medium mb-2 text-destructive">
											Error
										</h4>
										<pre
											class="text-sm bg-destructive/10 text-destructive p-2 rounded-md overflow-x-auto">{run.error}</pre>
									</div>
								{/if}
								{#if run.stepRuns.length > 0}
									<div>
										<h4 class="text-sm font-medium mb-2">Steps</h4>
										<Table.Root>
											<Table.Header>
												<Table.Row>
													<Table.Head>Status</Table.Head>
													<Table.Head>Started</Table.Head>
													<Table.Head>Completed</Table.Head>
												</Table.Row>
											</Table.Header>
											<Table.Body>
												{#each run.stepRuns as stepRun}
													<Table.Row>
														<Table.Cell>
															<Badge variant={`status.${stepRun.status}`}>
																{stepRun.status}
															</Badge>
														</Table.Cell>
														<Table.Cell>
															{formatDate(stepRun.startedAt)}
														</Table.Cell>
														<Table.Cell>
															{stepRun.completedAt
																? formatDate(stepRun.completedAt)
																: '-'}
														</Table.Cell>
													</Table.Row>
												{/each}
											</Table.Body>
										</Table.Root>
									</div>
								{/if}
							</div>
						</Card.Content>
					{/if}
				</Card.Root>
			{/each}
		{/if}
	{/if}
</div>
