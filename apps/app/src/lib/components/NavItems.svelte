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
	import IconTooltip from './IconTooltip.svelte';

	let { children, class: className = undefined }: { class: string | undefined } = $props();
</script>

<nav class={cn('flex items-center', className)} style="view-transition-name: nav">
	<IconTooltip tooltipText="Recordings" href="/recordings" variant="ghost" size="icon">
		<ListIcon class="h-4 w-4" aria-hidden="true" />
	</IconTooltip>
	<IconTooltip tooltipText="Settings" href="/settings" variant="ghost" size="icon">
		<SlidersVerticalIcon class="h-4 w-4" aria-hidden="true" />
	</IconTooltip>
	<IconTooltip
		tooltipText="View project on GitHub"
		href="https://github.com/braden-w/whispering"
		target="_blank"
		rel="noopener noreferrer"
		variant="ghost"
		size="icon"
	>
		<GithubIcon class="h-4 w-4" aria-hidden="true" />
	</IconTooltip>
	<IconTooltip tooltipText="Toggle dark mode" onclick={toggleMode} variant="ghost" size="icon">
		<SunIcon
			class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
		/>
		<MoonIcon
			class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
		/>
	</IconTooltip>
	{#if children}
		{@render children()}
	{/if}
</nav>
