<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from 'repo/ui/components/button';
</script>

<span>
	Transcription complete!{#if $page.url.pathname !== '/recordings'}
		{' '}Check it out <Button href="/recordings" variant="link" class="h-fit px-0 py-0">here</Button
		>.{/if}
</span>
