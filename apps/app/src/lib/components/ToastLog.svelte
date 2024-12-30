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
	import { mode } from 'mode-watcher';
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
		<div
			class="space-y-3 py-4"
			data-sonner-toaster
			data-theme={$mode}
			data-rich-colors="true"
		>
			{#each toastLogDialog.logs as log}
				<Alert.Root
					data-sonner-toast
					data-type={log.variant}
					data-styled="true"
					data-mounted="true"
				>
					{#if log.variant === 'error'}
						<div data-icon><AlertCircle class="h-4 w-4" /></div>
					{:else if log.variant === 'warning'}
						<div data-icon><AlertTriangle class="h-4 w-4" /></div>
					{:else if log.variant === 'success'}
						<div data-icon><CheckCircle2 class="h-4 w-4" /></div>
					{:else if log.variant === 'info'}
						<div data-icon><Info class="h-4 w-4" /></div>
					{:else if log.variant === 'loading'}
						<div data-icon><Loader2 class="h-4 w-4 animate-spin" /></div>
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
		</div>
		{#if toastLogDialog.logs.length === 0}
			<div class="py-4 text-center text-muted-foreground">
				No logs to display
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
