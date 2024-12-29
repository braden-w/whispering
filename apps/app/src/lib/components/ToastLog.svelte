<script module lang="ts">
	const toastLogDialog = (() => {
		let isOpen = $state(false);
		let logs = $state<ToastAndNotifyOptions[]>([]);
		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(value: boolean) {
				isOpen = value;
			},
			get logs() {
				return logs;
			},
			addLog: (log: ToastAndNotifyOptions) => {
				logs.push(log);
			},
			clearLogs: () => {
				logs = [];
			},
		};
	})();

	export { toastLogDialog };
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		LogsIcon,
		AlertCircle,
		CheckCircle2,
		Info,
		Loader2,
		AlertTriangle,
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { cn } from '$lib/utils';
	import type { ToastAndNotifyOptions } from '@repo/shared';

	const variantConfig = {
		error: {
			icon: AlertCircle,
			class:
				'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
		},
		success: {
			icon: CheckCircle2,
			class:
				'border-success/50 text-success dark:border-success [&>svg]:text-success',
		},
		info: {
			icon: Info,
			class:
				'border-sky-500/50 text-sky-500 dark:border-sky-500 [&>svg]:text-sky-500',
		},
		loading: {
			icon: Loader2,
			class: 'border-muted text-muted-foreground [&>svg]:animate-spin',
		},
		warning: {
			icon: AlertTriangle,
			class:
				'border-warning/50 text-warning dark:border-warning [&>svg]:text-warning',
		},
	};
</script>

<Dialog.Root bind:open={toastLogDialog.isOpen}>
	<Dialog.Trigger>
		<Button variant="outline">
			<LogsIcon />
			Logging
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Logs</Dialog.Title>
			<Dialog.Description>
				System notifications and status updates
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3 py-4">
			{#each toastLogDialog.logs as log}
				{@const config = variantConfig[log.variant]}
				<Alert.Root class={cn('transition-colors', config.class)}>
					<svelte:component this={config.icon} class="h-4 w-4" />
					<Alert.Title
						class="text-sm font-semibold leading-none tracking-tight"
					>
						{log.title}
					</Alert.Title>
					<Alert.Description class="text-sm opacity-90">
						{log.description}
					</Alert.Description>
				</Alert.Root>
			{/each}
		</div>
		{#if toastLogDialog.logs.length === 0}
			<div class="py-4 text-center text-muted-foreground">
				No logs to display
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
