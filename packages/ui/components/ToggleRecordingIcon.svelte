<script lang="ts">
	export let isRecording = false;
	$: icon = isRecording ? '🟥' : '🎙️';
</script>

<button
	class="drop-shadow-png transform text-6xl transition-transform duration-200 ease-in-out hover:scale-110"
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
