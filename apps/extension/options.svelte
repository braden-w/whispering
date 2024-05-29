<script lang="ts">
	import { recorder } from '~lib/stores';
	import '@repo/ui/app.pcss';
	import { Button } from '@repo/ui/components/button';
	import { cn } from '@repo/ui/utils';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-french-toast';
	import OptionsPage from '~pages/OptionsPage.svelte';
	import NavItems from '~lib/NavItems.svelte';
</script>

<div class="relative flex min-h-screen flex-col">
	<header
		class={cn(
			'border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur ',
			'flex h-14 w-full items-center justify-between px-4',
		)}
		style="view-transition-name: header"
	>
		<div class="flex gap-2">
			<Button variant="ghost" href="/">
				<span class="text-lg font-bold">whispering</span>
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Toggle recording"
				on:click={recorder.toggleRecording}
				style="view-transition-name: microphone-icon"
			>
				{#if recorder.recorderState === 'RECORDING'}
					🟥
				{:else}
					🎙️
				{/if}
			</Button>
		</div>
		<NavItems />
	</header>
	<main class="flex flex-1 justify-center p-4">
		<OptionsPage />
	</main>
</div>

<Toaster />
<ModeWatcher />
