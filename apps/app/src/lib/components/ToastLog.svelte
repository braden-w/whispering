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
	import { mode } from 'mode-watcher';
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
				return 'data-sonner-toast bg-[var(--error-bg)] border-[var(--error-border)] text-[var(--error-text)] [&>svg]:text-[var(--error-text)]';
			case 'warning':
				return 'data-sonner-toast bg-[var(--warning-bg)] border-[var(--warning-border)] text-[var(--warning-text)] [&>svg]:text-[var(--warning-text)]';
			case 'success':
				return 'data-sonner-toast bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)] [&>svg]:text-[var(--success-text)]';
			case 'info':
				return 'data-sonner-toast bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-text)] [&>svg]:text-[var(--info-text)]';
			case 'loading':
				return 'data-sonner-toast bg-[var(--normal-bg)] border-[var(--normal-border)] text-[var(--normal-text)] [&>svg]:animate-spin';
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
		{#each toastLogDialog.logs as log}
			<Alert.Root
				data-sonner-toast
				data-theme={$mode}
				data-rich-colors
				data-type={log.variant}
				data-styled="true"
				data-mounted="true"
				data-sonner-toaster
			>
				{#if log.variant === 'error'}
					<AlertCircle class="h-4 w-4" data-icon />
				{:else if log.variant === 'warning'}
					<AlertTriangle class="h-4 w-4" data-icon />
				{:else if log.variant === 'success'}
					<CheckCircle2 class="h-4 w-4" data-icon />
				{:else if log.variant === 'info'}
					<Info class="h-4 w-4" data-icon />
				{:else if log.variant === 'loading'}
					<Loader2 class="h-4 w-4 animate-spin" data-icon />
				{/if}
				<div data-content>
					<Alert.Title data-title>
						{log.title}
					</Alert.Title>
					<Alert.Description data-description>
						{log.description}
					</Alert.Description>
				</div>
			</Alert.Root>
		{/each}

		{#if toastLogDialog.logs.length === 0}
			<div class="py-4 text-center text-muted-foreground">
				No logs to display
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style lang="postcss">
	/* Copy the entire Sonner CSS here */
</style>
