<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Table from '$lib/components/ui/table';
	import { createTransformationRunsByIdQuery } from '$lib/query/transformationRuns/queries';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import { format } from 'date-fns';
	import CopyableCode from '$lib/components/CopyableCode.svelte';
	import { Label } from '$lib/components/ui/label';

	let { transformationId }: { transformationId: string } = $props();

	let expandedRunId = $state<string | null>(null);

	function toggleRunExpanded(runId: string) {
		expandedRunId = expandedRunId === runId ? null : runId;
	}

	function formatDate(dateStr: string) {
		return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
	}

	const transformationsQuery = createTransformationRunsByIdQuery(
		() => transformationId,
	);
</script>

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
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Expand</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Started</Table.Head>
					<Table.Head>Completed</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each runs as run}
					<Table.Row>
						<Table.Cell>
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 shrink-0"
								onclick={() => toggleRunExpanded(run.id)}
							>
								{#if expandedRunId === run.id}
									<ChevronDown class="h-4 w-4" />
								{:else}
									<ChevronRight class="h-4 w-4" />
								{/if}
							</Button>
						</Table.Cell>
						<Table.Cell>
							<Badge variant={`status.${run.status}`}>
								{run.status}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							{formatDate(run.startedAt)}
						</Table.Cell>
						<Table.Cell>
							{run.completedAt ? formatDate(run.completedAt) : '-'}
						</Table.Cell>
					</Table.Row>

					{#if expandedRunId === run.id}
						<Table.Row>
							<Table.Cell class="space-y-4" colspan={4}>
								<CopyableCode codeText={run.input} label="Input" />
								{#if run.output}
									<CopyableCode codeText={run.output} label="Output" />
								{:else if run.error}
									<CopyableCode
										codeText={run.error}
										label="Error"
										variant="error"
									/>
								{/if}
								{#if run.stepRuns.length > 0}
									<div class="flex flex-col gap-2">
										<Label class="text-sm font-medium">Steps</Label>
										<Card.Root>
											<Table.Root>
												<Table.Header>
													<Table.Row>
														<Table.Head>Status</Table.Head>
														<Table.Head>Started</Table.Head>
														<Table.Head>Completed</Table.Head>
														<Table.Head>Input</Table.Head>
														<Table.Head>Output</Table.Head>
														<Table.Head>Error</Table.Head>
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
															<Table.Cell>
																{stepRun.input}
															</Table.Cell>
															<Table.Cell>
																{stepRun.output}
															</Table.Cell>
															<Table.Cell>
																{stepRun.error}
															</Table.Cell>
														</Table.Row>
													{/each}
												</Table.Body>
											</Table.Root>
										</Card.Root>
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/if}
				{/each}
			</Table.Body>
		</Table.Root>
	{/if}
{/if}
