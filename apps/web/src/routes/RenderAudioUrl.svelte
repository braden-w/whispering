<script lang="ts">
	import { onDestroy } from 'svelte';

	export let audioUrl: string;
	onDestroy(() => {
		URL.revokeObjectURL(audioUrl);
	});
</script>

<audio controls src={audioUrl}> Your browser does not support the audio element. </audio>
