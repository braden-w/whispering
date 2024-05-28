<script lang="ts">
	let { children } = $props();
</script>

<main class="flex flex-1 justify-center p-4">
	{@render children()}
</main>
