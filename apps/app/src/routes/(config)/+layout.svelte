<script lang="ts">
	import NavItems from '../NavItems.svelte';
</script>

<header
	class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur"
	style="view-transition-name: header"
>
	<div class="container flex h-14 w-full max-w-screen-2xl items-center justify-between">
		<a class="flex items-center gap-2" href="/">
			<span aria-hidden="true" role="img" style="view-transition-name: microphone-icon"> 🎙️ </span>
			<span class="text-lg font-bold">whispering</span>
		</a>
		<NavItems />
	</div>
</header>
<main class="flex flex-1 justify-center p-4">
	<slot />
</main>
