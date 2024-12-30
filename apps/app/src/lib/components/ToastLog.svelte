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
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { ToastAndNotifyOptions } from '@repo/shared';
	import {
		AlertCircle,
		AlertTriangle,
		CheckCircle2,
		Info,
		Loader2,
		LogsIcon,
	} from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	const getVariantClass = (variant: ToastAndNotifyOptions['variant']) => {
		switch (variant) {
			case 'error':
				return 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive';
			case 'warning':
				return 'border-amber-500/50 text-amber-500 dark:border-amber-500 [&>svg]:text-amber-500';
			case 'success':
				return 'border-green-500/50 text-green-500 dark:border-green-500 [&>svg]:text-green-500';
			case 'info':
				return 'border-sky-500/50 text-sky-500 dark:border-sky-500 [&>svg]:text-sky-500';
			case 'loading':
				return 'border-muted text-muted-foreground [&>svg]:animate-spin';
		}
	};
</script>

<Dialog.Root bind:open={toastLogDialog.isOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button variant="outline" {...props}>
				<LogsIcon />
				Logging
			</Button>
		{/snippet}
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
				<Alert.Root class={getVariantClass(log.variant)}>
					{#if log.variant === 'error'}
						<AlertCircle class="h-4 w-4" />
					{:else if log.variant === 'warning'}
						<AlertTriangle class="h-4 w-4" />
					{:else if log.variant === 'success'}
						<CheckCircle2 class="h-4 w-4" />
					{:else if log.variant === 'info'}
						<Info class="h-4 w-4" />
					{:else if log.variant === 'loading'}
						<Loader2 class="h-4 w-4 animate-spin" />
					{/if}
					<Alert.Title>
						{log.title}
					</Alert.Title>
					<Alert.Description>
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
