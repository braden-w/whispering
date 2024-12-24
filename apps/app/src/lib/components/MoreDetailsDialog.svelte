<script module lang="ts">
	export const errorMoreDetailsDialog = (() => {
		let isOpen = $state(false);
		let error = $state<unknown>(null);
		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(value: boolean) {
				isOpen = value;
			},
			get error() {
				if (typeof error === 'string') {
					return error;
				}
				if (error instanceof Error) {
					return error.message;
				}
				return JSON.stringify(error, null, 2);
			},
			openWithError: (e: unknown) => {
				error = e;
				isOpen = true;
			},
		};
	})();
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<Dialog.Root bind:open={errorMoreDetailsDialog.isOpen}>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>More details</Dialog.Title>
			<Dialog.Description
				>The following is the raw error message.</Dialog.Description
			>
		</Dialog.Header>
		<pre
			class="bg-muted relative whitespace-pre-wrap break-words rounded p-4 pr-12 font-mono text-sm">{errorMoreDetailsDialog.error}</pre>
	</Dialog.Content>
</Dialog.Root>
