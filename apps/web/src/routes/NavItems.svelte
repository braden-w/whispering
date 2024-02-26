<script lang="ts">
	import '@repo/ui/app.pcss';
	import { Button } from '@repo/ui/components/button';
	import { toggleMode } from '@repo/ui/components/sonner';
	import AdjustmentsHorizontalIcon from '~icons/heroicons/adjustments-horizontal';
	import ListIcon from '~icons/lucide/list';
	import MoonIcon from '~icons/lucide/moon';
	import SunIcon from '~icons/lucide/sun';
	import GithubIcon from '~icons/mdi/github';
</script>

<nav class="flex items-center">
	<Button
		href="/recordings"
		variant="ghost"
		size="icon"
		style="view-transition-name: nav-recordings"
	>
		<ListIcon aria-hidden="true" />
		<span class="sr-only">Settings</span>
	</Button>
	<Button href="/settings" variant="ghost" size="icon" style="view-transition-name: nav-settings">
		<AdjustmentsHorizontalIcon aria-hidden="true" />
		<span class="sr-only">Settings</span>
	</Button>
	<Button
		href="https://github.com/braden-w/whispering"
		target="_blank"
		rel="noopener noreferrer"
		title="View project on GitHub"
		variant="ghost"
		size="icon"
		style="view-transition-name: nav-github"
	>
		<GithubIcon class="h-4 w-4" aria-hidden="true" />
		<span class="sr-only">View project on GitHub</span>
	</Button>
	<Button on:click={toggleMode} variant="ghost" size="icon" style="view-transition-name: nav-mode">
		<SunIcon
			class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
		/>
		<MoonIcon
			class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
		/>
		<span class="sr-only">Toggle dark mode</span>
	</Button>
</nav>
