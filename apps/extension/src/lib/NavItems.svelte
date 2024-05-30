<script lang="ts">
	import '@repo/ui/app.pcss';
	import { Button } from '@repo/ui/components/button';
	import * as Tooltip from '@repo/ui/components/tooltip';
	import { AdjustmentsVerticalIcon } from '@repo/ui/icons';
	import { toggleMode } from 'mode-watcher';
	import MoonIcon from '~icons/lucide/moon';
	import SunIcon from '~icons/lucide/sun';
	import GithubIcon from '~icons/mdi/github';
	import ListIcon from '~icons/solar/playlist-outline';
</script>

<nav class="flex items-center" style="view-transition-name: nav">
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button builders={[builder]} href="/recordings" variant="ghost" size="icon">
				<ListIcon aria-hidden="true" />
				<span class="sr-only">Settings</span>
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Recordings</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				on:click={chrome.runtime.openOptionsPage}
				variant="ghost"
				size="icon"
			>
				<AdjustmentsVerticalIcon aria-hidden="true" />
				<span class="sr-only">Settings</span>
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Settings</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				href="https://github.com/braden-w/whispering"
				target="_blank"
				rel="noopener noreferrer"
				variant="ghost"
				size="icon"
			>
				<GithubIcon class="h-4 w-4" aria-hidden="true" />
				<span class="sr-only">View project on GitHub</span>
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>View project on GitHub</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button builders={[builder]} on:click={toggleMode} variant="ghost" size="icon">
				<SunIcon
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<MoonIcon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle dark mode</span>
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Toggle dark mode</p>
		</Tooltip.Content>
	</Tooltip.Root>
</nav>
