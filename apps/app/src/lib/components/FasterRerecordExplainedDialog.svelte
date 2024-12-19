<script module lang="ts">
	export const fasterRerecordExplainedDialog = (() => {
		let isOpen = $state(false);
		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(v) {
				isOpen = v;
			},
			open() {
				isOpen = true;
			},
		};
	})();
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
</script>

<Dialog.Root bind:open={fasterRerecordExplainedDialog.isOpen}>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>About recording sessions</Dialog.Title>
			<Dialog.Description>Faster re-recording explained</Dialog.Description>
		</Dialog.Header>
		<p class="text-sm leading-7">
			Whispering can allow the media stream to remain active after you start
			recording, enabling faster re-recording with reduced latency.
		</p>
		<p class="text-sm leading-7">
			This feature is particularly beneficial if you need to record multiple
			takes in quick succession or if the delay between activation and the start
			of recording feels too long.
		</p>
		<p class="text-sm leading-7">
			However, while using this feature, your computer will indicate that this
			tab is still accessing the microphone during the recording session.
		</p>
		<p class="text-sm leading-7">
			When finished, click the 🔴 button to close the stream, end the session,
			and end microphone access.
		</p>
	</Dialog.Content>
</Dialog.Root>
