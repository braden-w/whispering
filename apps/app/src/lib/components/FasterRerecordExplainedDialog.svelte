<script context="module">
	export const fasterRerecordExplainedDialog = (() => {
		let isOpen = $state(false);
		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(v) {
				isOpen = v;
			},
		};
	})();
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';

	let { class: className }: { class?: string | undefined } = $props();
</script>

<Dialog.Root bind:open={fasterRerecordExplainedDialog.isOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>About recording sessions</Dialog.Title>
			<Dialog.Description>Faster re-recording explained</Dialog.Description>
		</Dialog.Header>
		<p>
			Whispering keeps the media stream open after you start recording, enabling quick re-recording
			with reduced latency.
		</p>
		<p>This means your computer will show this tab is still using the microphone.</p>
		<p>When finished, click the 🔴 button to close the stream and end microphone access.</p>
	</Dialog.Content>
</Dialog.Root>
