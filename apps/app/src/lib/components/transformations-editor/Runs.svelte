<script lang="ts">
	import CopyablePre from '$lib/components/copyable/CopyablePre.svelte';
	import CopyableTextareaExpandsToDialog from '$lib/components/copyable/CopyableTextareaExpandsToDialog.svelte';
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import * as Card from '@repo/ui/card';
	import { Label } from '@repo/ui/label';
	import * as Table from '@repo/ui/table';
	import type { TransformationRun } from '$lib/services/db';
	import { getTransformationStepRunTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { format } from 'date-fns';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { runs }: { runs: TransformationRun[] } = $props();

	let expandedRunId = $state<string | null>(null);

	function toggleRunExpanded(runId: string) {
		expandedRunId = expandedRunId === runId ? null : runId;
	}

	function formatDate(dateStr: string) {
		return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
	}
</script>

{#if runs.length === 0}
	<div class="flex h-full items-center justify-center">
		<div class="flex flex-col items-center gap-4 text-center">
			<div class="rounded-full bg-muted p-4">
				<ChevronRight class="size-6 text-muted-foreground" />
			</div>
			<div class="space-y-1">
				<h3 class="text-xl font-semibold">No Runs Yet</h3>
				<p class="text-muted-foreground">
					When you run a transformation, the results will appear here.
				</p>
			</div>
		</div>
	</div>
{:else}
	<div class="h-full overflow-y-auto px-2">
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
								class="size-8 shrink-0"
								onclick={() => toggleRunExpanded(run.id)}
							>
								{#if expandedRunId === run.id}
									<ChevronDown class="size-4" />
								{:else}
									<ChevronRight class="size-4" />
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
							<Table.Cell class="space-y-4 p-4" colspan={4}>
								<Label class="text-sm font-medium">Input</Label>
								<CopyablePre variant="text" copyableText={run.input} />

								{#if run.status === 'completed'}
									<Label class="text-sm font-medium">Output</Label>
									<CopyablePre variant="text" copyableText={run.output} />
								{:else if run.status === 'failed'}
									<Label class="text-sm font-medium">Error</Label>
									<CopyablePre variant="error" copyableText={run.error} />
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
																<CopyableTextareaExpandsToDialog
																	id={getTransformationStepRunTransitionId({
																		stepRunId: stepRun.id,
																		propertyName: 'input',
																	})}
																	title="Step Input"
																	label="step input"
																	text={stepRun.input}
																/>
															</Table.Cell>
															<Table.Cell>
																{#if stepRun.status === 'completed'}
																	<CopyableTextareaExpandsToDialog
																		id={getTransformationStepRunTransitionId({
																			stepRunId: stepRun.id,
																			propertyName: 'output',
																		})}
																		title="Step Output"
																		label="step output"
																		text={stepRun.output}
																	/>
																{:else if stepRun.status === 'failed'}
																	<CopyableTextareaExpandsToDialog
																		id={getTransformationStepRunTransitionId({
																			stepRunId: stepRun.id,
																			propertyName: 'error',
																		})}
																		title="Step Error"
																		label="step error"
																		text={stepRun.error}
																	/>
																{/if}
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
	</div>
{/if}
