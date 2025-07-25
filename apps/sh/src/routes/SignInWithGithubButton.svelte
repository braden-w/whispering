<script lang="ts">
	import * as rpc from '$lib/query';
	import * as DropdownMenu from '@repo/ui/dropdown-menu';
	import { createMutation } from '@tanstack/svelte-query';
	import { Loader2 } from 'lucide-svelte';
	import { siGithub as Github } from 'simple-icons';

	const signInWithGithubMutation = createMutation(
		rpc.auth.signInWithGithub.options,
	);
</script>

<DropdownMenu.Item
	class="cursor-pointer"
	onclick={() => signInWithGithubMutation.mutate({})}
>
	{#if signInWithGithubMutation.isPending}
		<Loader2 class="animate-spin" />
	{:else}
		<span class="dark:invert">
			{@html Github.svg}
		</span>
		Sign in with GitHub
	{/if}
</DropdownMenu.Item>
