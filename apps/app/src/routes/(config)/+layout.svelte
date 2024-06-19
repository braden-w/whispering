<script lang="ts">
	import { recorder } from '$lib/stores';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import { NavItems } from '$lib/components/shared';
</script>

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
	<slot />
</main>
