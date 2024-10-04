<script context="module" lang="ts">
export const errorMoreDetailsDialog = (() => {
	let isOpen = $state(false);
	let error = $state<unknown>(null);
	return {
		get isOpen() {
			return isOpen;
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
  import * as Dialog from "$lib/components/ui/dialog"
</script>

<Dialog.Root bind:open={errorMoreDetailsDialog.isOpen}>
  <Dialog.Content class="sm:max-w-xl">
    <Dialog.Header>
      <Dialog.Title>About recording sessions</Dialog.Title>
      <Dialog.Description>More details</Dialog.Description>
    </Dialog.Header>
    <pre class="text-sm leading-7 whitespace-pre-wrap overflow-auto max-h-96">
			{errorMoreDetailsDialog.error}
		</pre>
  </Dialog.Content>
</Dialog.Root>
