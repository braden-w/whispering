<script lang="ts">
	import { recordings } from '$lib/stores/recordings';
	import { Button } from '@repo/ui/components/button';
	import { Effect } from 'effect';
	import TrashIcon from '~icons/heroicons/trash';
	import TranscriptionIcon from '~icons/material-symbols/speech-to-text';

	export let id: string;
</script>

<Button
	variant="ghost"
	size="icon"
	on:click={() => recordings.transcribeRecording(id).pipe(Effect.runPromise).catch(console.error)}
>
	<TranscriptionIcon />
</Button>

<Button
	variant="ghost"
	size="icon"
	on:click={() => recordings.deleteRecording(id).pipe(Effect.runPromise).catch(console.error)}
>
	<TrashIcon />
</Button>
