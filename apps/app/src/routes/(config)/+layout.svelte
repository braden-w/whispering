<script lang="ts">
	import NavItems from '$lib/components/NavItems.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { recorder } from '$lib/stores';
	import { cn } from '$lib/utils.js';
</script>

<header
	class={cn(
		'border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur ',
		'flex h-14 w-full items-center justify-between px-4',
	)}
	style="view-transition-name: header"
>
	<div class="flex gap-2">
		<WhisperingButton tooltipText="Go home" href="/" variant="ghost">
			<span class="text-lg font-bold">whispering</span>
		</WhisperingButton>
		<WhisperingButton
			tooltipText="Toggle recording"
			onclick={recorder.toggleRecording}
			variant="ghost"
			size="icon"
			style="view-transition-name: microphone-icon"
		>
			{#if recorder.recorderState === 'RECORDING'}
				🟥
			{:else}
				🎙️
			{/if}
		</WhisperingButton>
	</div>
	<NavItems />
</header>
<main class="flex flex-1 justify-center p-4">
	<slot />
</main>
