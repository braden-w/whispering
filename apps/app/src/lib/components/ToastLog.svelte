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
	import { LogsIcon } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { ToastAndNotifyOptions } from '@repo/shared';
</script>

<Dialog.Root bind:open={toastLogDialog.isOpen}>
	<Dialog.Trigger>
		<Button variant="outline"> 
			<LogsIcon />
			Logging
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>Logs</Dialog.Title>
			<Dialog.Description
				>The following is the raw error message.</Dialog.Description
			>
		</Dialog.Header>
		{#each toastLogDialog.logs as log}
			<!-- TODO: Display the log as a very pretty single line -->
			<div class="flex flex-col gap-2">
				<span class="text-sm font-mono">{log.title}</span>
				<span class="text-sm font-mono">{log.description}</span>
			</div>
		{/each}
	</Dialog.Content>
</Dialog.Root>
