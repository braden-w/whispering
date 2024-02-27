<script lang="ts">
	import * as Tooltip from '@repo/ui/components/tooltip';
	import { recordings } from '$lib/stores/recordings';
	import { Button } from '@repo/ui/components/button';
	import { Effect } from 'effect';
	import TrashIcon from '~icons/heroicons/trash';
	import TranscriptionIcon from '~icons/material-symbols/mdi-transcribe';

	export let id: string;
</script>

<Tooltip.Root>
	<Tooltip.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="icon"
			on:click={() => recordings.transcribeRecording(id).pipe(Effect.runPromise)}
		>
			<TranscriptionIcon />
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>Transcribe Recording</p>
	</Tooltip.Content>
</Tooltip.Root>

<Tooltip.Root>
	<Tooltip.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="icon"
			on:click={() => recordings.deleteRecording(id).pipe(Effect.runPromise)}
		>
			<TrashIcon />
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>Delete Recording</p>
	</Tooltip.Content>
</Tooltip.Root>
