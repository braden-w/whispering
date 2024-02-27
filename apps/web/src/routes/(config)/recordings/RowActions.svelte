<script lang="ts">
	import { recordings } from '$lib/stores/recordings';
	import { copyRecordingText } from '$lib/system-apis/clipboard';
	import type { Recording } from '@repo/recorder/services/recordings-db';
	import { Button } from '@repo/ui/components/button';
	import * as Tooltip from '@repo/ui/components/tooltip';
	import { Effect } from 'effect';
	import ClipboardIcon from '~icons/heroicons/clipboard';
	import EditIcon from '~icons/heroicons/pencil';
	import TrashIcon from '~icons/heroicons/trash';
	import TranscriptionIcon from '~icons/lucide/repeat';

	export let recording: Recording;
</script>

<div class="flex items-center">
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				on:click={() => recordings.transcribeRecording(recording.id).pipe(Effect.runPromise)}
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
				on:click={() => recordings.deleteRecording(recording.id).pipe(Effect.runPromise)}
			>
				<EditIcon />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Edit Recording</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				on:click={() => copyRecordingText(recording)}
			>
				<ClipboardIcon />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Copy Transcript</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				on:click={() => recordings.deleteRecording(recording.id).pipe(Effect.runPromise)}
			>
				<TrashIcon />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Delete Recording</p>
		</Tooltip.Content>
	</Tooltip.Root>
</div>
