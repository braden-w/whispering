<script lang="ts">
	const RECORDING_STATES = ['IDLE', 'RECORDING', 'TRANSCRIBING'] as const;
	type RecordingState = (typeof RECORDING_STATES)[number];
	const recordingStateToIcon = {
		IDLE: '🎙️',
		RECORDING: '🟥',
		TRANSCRIBING: '🔄'
	} satisfies Record<RecordingState, string>;
	export let recordingState: RecordingState = 'IDLE';
	$: icon = recordingStateToIcon[recordingState];
</script>

<button
	class="drop-shadow-png transform text-6xl transition-transform duration-200 ease-in-out hover:scale-110 md:text-7xl"
	on:click
	type="button"
	aria-label="Toggle recording"
>
	{icon}
</button>

<style>
	.drop-shadow-png {
		filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));
	}
</style>
