<script lang="ts">
	import NavItems from '$lib/components/NavItems.svelte';
	import RecordingControls from '$lib/components/RecordingControls.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { getRecorderFromContext } from '$lib/query/singletons/recorder';
	import { cn } from '$lib/utils.js';

	const recorder = getRecorderFromContext();

	let { children } = $props();
</script>

<header
	class={cn(
		'border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur ',
		'flex h-14 w-full items-center px-4 md:px-8 gap-1.5',
	)}
	style="view-transition-name: header"
>
	<div class="mr-auto flex gap-2">
		<WhisperingButton
			tooltipContent="Go home"
			href="/"
			variant="ghost"
			class="-ml-4"
		>
			<span class="text-lg font-bold">whispering</span>
		</WhisperingButton>
	</div>
	<RecordingControls />
	<WhisperingButton
		tooltipContent="Toggle recording"
		onclick={recorder.toggleRecording}
		variant="ghost"
		size="icon"
		style="view-transition-name: microphone-icon"
	>
		{#if recorder.recorderState === 'SESSION+RECORDING'}
			⏹️
		{:else}
			🎙️
		{/if}
	</WhisperingButton>
	<NavItems class="-mr-4" />
</header>

{@render children()}
