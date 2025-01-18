<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { GithubIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils';
	import { LogicalSize, getCurrentWindow } from '@tauri-apps/api/window';
	import {
		FilterIcon,
		ListIcon,
		Minimize2Icon,
		MoonIcon,
		SlidersVerticalIcon,
		SunIcon,
	} from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';

	let { class: className }: { class?: string } = $props();
</script>

<nav
	class={cn('flex items-center', className)}
	style="view-transition-name: nav"
>
	<WhisperingButton
		tooltipContent="Recordings"
		href="/recordings"
		variant="ghost"
		size="icon"
	>
		<ListIcon class="h-4 w-4" aria-hidden="true" />
	</WhisperingButton>
	<WhisperingButton
		tooltipContent="Transformations"
		href="/transformations"
		variant="ghost"
		size="icon"
	>
		<FilterIcon class="h-4 w-4" aria-hidden="true" />
	</WhisperingButton>
	<WhisperingButton
		tooltipContent="Settings"
		href="/settings"
		variant="ghost"
		size="icon"
	>
		<SlidersVerticalIcon class="h-4 w-4" aria-hidden="true" />
	</WhisperingButton>
	<WhisperingButton
		tooltipContent="View project on GitHub"
		href="https://github.com/braden-w/whispering"
		target="_blank"
		rel="noopener noreferrer"
		variant="ghost"
		size="icon"
	>
		<GithubIcon class="h-4 w-4" aria-hidden="true" />
	</WhisperingButton>
	<WhisperingButton
		tooltipContent="Toggle dark mode"
		onclick={toggleMode}
		variant="ghost"
		size="icon"
	>
		<SunIcon
			class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
		/>
		<MoonIcon
			class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
		/>
	</WhisperingButton>
	{#if window.__TAURI_INTERNALS__}
		<WhisperingButton
			tooltipContent="Minimize"
			onclick={() => getCurrentWindow().setSize(new LogicalSize(72, 84))}
			variant="ghost"
			size="icon"
		>
			<Minimize2Icon class="h-4 w-4" aria-hidden="true" />
		</WhisperingButton>
	{/if}
</nav>
