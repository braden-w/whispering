<script lang="ts">
	import { goto } from '$app/navigation';
	import { workspaces } from '$lib/stores/workspaces.svelte';
	import { Button } from '@repo/ui/button';
	import { onMount } from 'svelte';

	// If there's only one workspace, redirect to it
	// Otherwise, redirect to the workspaces list
	onMount(() => {
		if (workspaces.value.length === 1) {
			goto(`/workspaces/${workspaces.value[0].id}`);
		} else {
			goto('/workspaces');
		}
	});
</script>

<div class="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
	<h1 class="text-4xl font-bold tracking-tight mb-4">Welcome to epicenter.sh</h1>
	<p class="text-muted-foreground mb-8">
		Connect to your OpenCode servers to start chatting
	</p>
	<Button href="/workspaces" size="lg">
		Go to Workspaces
	</Button>
</div>
