<script context="module">
	export const fasterWhisperServerExplainedDialog = (() => {
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
</script>

<Dialog.Root bind:open={fasterWhisperServerExplainedDialog.isOpen}>
	<Dialog.Content class="sm:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Setting Up Local Transcription with Whisper</Dialog.Title>
			<Dialog.Description>
				How to setup local Whisper API with
				<code
					class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
				>
					faster-whisper-server
				</code>
			</Dialog.Description>
		</Dialog.Header>
		<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
			1. Prerequisites:
		</h2>
		<p class="text-sm leading-7">
			Ensure Docker or an equivalent (e.g., Orbstack) is installed on your computer.
		</p>

		<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
			2. Run the Appropriate Command:
		</h2>

		<h3>For GPU Mode (for computers with CUDA support):</h3>
		<code
			>docker run --gpus=all --publish 8000:8000 --volume
			~/.cache/huggingface:/root/.cache/huggingface fedirz/faster-whisper-server:latest-cuda</code
		>

		<h3>For CPU Mode (for computers without CUDA support):</h3>
		<code
			>docker run --publish 8000:8000 --volume ~/.cache/huggingface:/root/.cache/huggingface
			fedirz/faster-whisper-server:latest-cpu</code
		>

		<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
			4. Additional Configuration for Web App Users:
		</h2>
		<p class="text-sm leading-7">
			If you're using the Whispering web app instead of the desktop app, set the appropriate
			environment variables to allow CORS requests. (Specific variables not provided)
		</p>

		<p class="text-sm leading-7">
			By following these steps, you can set up local transcription on your computer using Whisper
			with the Faster Whisper Server module.
		</p>
	</Dialog.Content>
</Dialog.Root>
