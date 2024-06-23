<script lang="ts">
	import {
		GithubIcon,
		ListIcon,
		MoonIcon,
		SlidersVerticalIcon,
		SunIcon,
	} from '$lib/components/icons';
	import { cn } from '$lib/utils';
	import { toggleMode } from 'mode-watcher';
	import WhisperingButton from './WhisperingButton.svelte';

	let { children, class: className }: { class?: string } = $props();
</script>

<nav class={cn('flex items-center', className)} style="view-transition-name: nav">
	<WhisperingButton tooltipText="Recordings" href="/recordings" variant="ghost" size="icon">
		<ListIcon class="h-4 w-4" aria-hidden="true" />
	</WhisperingButton>
	<WhisperingButton tooltipText="Settings" href="/settings" variant="ghost" size="icon">
		<SlidersVerticalIcon class="h-4 w-4" aria-hidden="true" />
	</WhisperingButton>
	<WhisperingButton
		tooltipText="View project on GitHub"
		href="https://github.com/braden-w/whispering"
		target="_blank"
		rel="noopener noreferrer"
		variant="ghost"
		size="icon"
	>
		<GithubIcon class="h-4 w-4" aria-hidden="true" />
	</WhisperingButton>
	<WhisperingButton tooltipText="Toggle dark mode" onclick={toggleMode} variant="ghost" size="icon">
		<SunIcon
			class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
		/>
		<MoonIcon
			class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
		/>
	</WhisperingButton>
	{#if children}
		{@render children()}
	{/if}
</nav>
