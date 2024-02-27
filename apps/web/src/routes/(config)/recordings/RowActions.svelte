<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/create-view-transition-name';
	import { recordings } from '$lib/stores/recordings';
	import { copyRecordingText } from '$lib/system-apis/clipboard';
	import type { Recording } from '@repo/recorder/services/recordings-db';
	import { Button } from '@repo/ui/components/button';
	import * as Dialog from '@repo/ui/components/dialog';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
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
	<Dialog.Root>
		<Dialog.Trigger>
			<Tooltip.Root>
				<Tooltip.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="icon">
						<EditIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Edit Recording</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Edit recording</Dialog.Title>
				<Dialog.Description>
					Make changes to your recording here. Click save when you're done.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label class="text-right">Name</Label>
					<Input id="name" value="Pedro Duarte" class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label class="text-right">Username</Label>
					<Input id="username" value="@peduarte" class="col-span-3" />
				</div>
			</div>
			<Dialog.Footer>
				<Button type="submit">Save changes</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				on:click={() => copyRecordingText(recording)}
				style="view-transition-name: {createRecordingViewTransitionName({
					recordingId: recording.id,
					propertyName: 'transcribedText'
				})}-copy-button"
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
