<script lang="ts">
	import '@repo/ui/app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-french-toast';
	import IndexPage from '~pages/IndexPage.svelte';
</script>

<div class="h-[28rem] w-96">
	<div class="relative flex min-h-screen flex-col">
		<IndexPage />
	</div>
</div>

<Toaster position="bottom-right" />
<ModeWatcher />
