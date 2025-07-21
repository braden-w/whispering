<script lang="ts">
	import { Button } from '@repo/ui/button';
	import { Badge } from '@repo/ui/badge';
	import * as Select from '@repo/ui/select';
	import * as Card from '@repo/ui/card';
	import { Settings, Zap, Code, MessageSquare } from 'lucide-svelte';

	let {
		currentMode = 'chat',
		onModeChange,
		isProcessing = false,
	}: {
		currentMode?: string;
		onModeChange?: (mode: string) => void;
		isProcessing?: boolean;
	} = $props();

	const modes = [
		{ value: 'chat', label: 'Chat', icon: MessageSquare, description: 'General conversation' },
		{ value: 'plan', label: 'Plan', icon: Settings, description: 'Planning and analysis' },
		{ value: 'build', label: 'Build', icon: Code, description: 'Code generation and execution' },
	];

	const currentModeConfig = $derived(modes.find(m => m.value === currentMode) || modes[0]);

	function handleModeSelect(value: string | undefined) {
		if (value && onModeChange) {
			onModeChange(value);
		}
	}
</script>

<Card.Root class="mb-4">
	<Card.Header class="pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Settings class="h-4 w-4" />
				<Card.Title class="text-base">Session Controls</Card.Title>
			</div>
			{#if isProcessing}
				<Badge variant="outline" class="text-xs">
					<Zap class="h-3 w-3 mr-1" />
					Processing
				</Badge>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="space-y-4">
		<!-- Mode Selection -->
		<div class="space-y-2">
			<label class="text-sm font-medium">Mode</label>
			<Select.Root value={currentMode} onSelectedChange={handleModeSelect}>
				<Select.Trigger class="w-full">
					<Select.Value>
						<div class="flex items-center gap-2">
							<svelte:component this={currentModeConfig.icon} class="h-4 w-4" />
							<span>{currentModeConfig.label}</span>
						</div>
					</Select.Value>
				</Select.Trigger>
				<Select.Content>
					{#each modes as mode}
						<Select.Item value={mode.value}>
							<div class="flex items-center gap-2">
								<svelte:component this={mode.icon} class="h-4 w-4" />
								<div>
									<div class="font-medium">{mode.label}</div>
									<div class="text-xs text-muted-foreground">{mode.description}</div>
								</div>
							</div>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<p class="text-xs text-muted-foreground">
				{currentModeConfig.description}
			</p>
		</div>

		<!-- Current Mode Info -->
		<div class="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
			<svelte:component this={currentModeConfig.icon} class="h-4 w-4 text-muted-foreground" />
			<span class="text-sm">
				Currently in <strong>{currentModeConfig.label}</strong> mode
			</span>
		</div>
	</Card.Content>
</Card.Root>