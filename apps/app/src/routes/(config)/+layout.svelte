<script lang="ts">
	import { recorder } from '$lib/stores/recorder';
	import { Button } from '@repo/ui/components/button';
	import * as Tooltip from '@repo/ui/components/tooltip';
	import NavItems from '../NavItems.svelte';
</script>

<header
	class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur"
	style="view-transition-name: header"
>
	<div class="container flex h-14 w-full max-w-screen-2xl items-center justify-between">
		<div class="flex gap-2">
			<Button
				variant="ghost"
				size="icon"
				aria-label="Toggle recording"
				onclick={recorder.toggleRecording}
				style="view-transition-name: microphone-icon"
			>
				{#if recorder.recorderState === 'RECORDING'}
					🟥
				{:else if recorder.recorderState === 'SAVING'}
					🔄
				{:else}
					🎙️
				{/if}
			</Button>
			<Button variant="ghost" href="/">
				<span class="text-lg font-bold">whispering</span>
			</Button>
		</div>
		<NavItems />
	</div>
</header>
<main class="flex flex-1 justify-center p-4">
	<slot />
</main>
