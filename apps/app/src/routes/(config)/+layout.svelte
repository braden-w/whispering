<script lang="ts">
	import CancelOrEndRecordingSessionButton from '$lib/components/CancelOrEndRecordingSessionButton.svelte';
	import NavItems from '$lib/components/NavItems.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { recorder, settings } from '$lib/stores';
	import { cn } from '$lib/utils.js';

	let { children } = $props();
</script>

<header
	class={cn(
		'border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur ',
		'flex h-14 w-full items-center justify-between px-4 md:px-8',
	)}
	style="view-transition-name: header"
>
	<div class="flex gap-2">
		<WhisperingButton tooltipText="Go home" href="/" variant="ghost" class="-ml-4">
			<span class="text-lg font-bold">whispering</span>
		</WhisperingButton>
		<WhisperingButton
			tooltipText="Toggle recording"
			onclick={() => recorder.toggleRecording(settings)}
			variant="ghost"
			size="icon"
			style="view-transition-name: microphone-icon"
		>
			{#if recorder.recorderState === 'RECORDING'}
				🔲
			{:else}
				🎙️
			{/if}
		</WhisperingButton>
		<CancelOrEndRecordingSessionButton />
	</div>
	<NavItems class="-mr-4" />
</header>

{#if children}
	{@render children()}
{/if}
