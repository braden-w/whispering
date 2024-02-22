<script lang="ts">
	export let blob: Blob;
</script>

<audio controls>
	<source type="audio/wav" src={URL.createObjectURL(blob)} />
	Your browser does not support the audio element.
</audio>
