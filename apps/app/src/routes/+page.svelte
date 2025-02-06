<script lang="ts">
	import NavItems from '$lib/components/NavItems.svelte';
	import RecordingControlsOrCancelRecordingSessionOrEndRecordingSessionButton from '$lib/components/RecordingControlsOrCancelRecordingSessionOrEndRecordingSessionButton.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import { useLatestRecording } from '$lib/query/recordings/queries';
	import { getRecorderFromContext } from '$lib/query/singletons/recorder';
	import type { Recording } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { createBlobUrlManager } from '$lib/utils/blobUrlManager';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { Loader2Icon } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import TranscribedTextDialog from './(config)/recordings/TranscribedTextDialog.svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Tabs from '$lib/components/ui/tabs';

	const recorder = getRecorderFromContext();
	const { latestRecordingQuery } = useLatestRecording();

	const latestRecording = $derived<Recording>(
		latestRecordingQuery.data ?? {
			id: '',
			title: '',
			subtitle: '',
			createdAt: '',
			updatedAt: '',
			timestamp: '',
			blob: new Blob(),
			transcribedText: '',
			transcriptionStatus: 'UNPROCESSED',
		},
	);

	const recorderStateAsIcon = $derived(
		recorder.recorderState === 'SESSION+RECORDING' ? '🔲' : '🎙️',
	);

	const blobUrlManager = createBlobUrlManager();

	const blobUrl = $derived.by(() => {
		if (!latestRecording.blob) return undefined;
		return blobUrlManager.createUrl(latestRecording.blob);
	});

	onDestroy(() => {
		blobUrlManager.revokeCurrentUrl();
	});
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<main class="flex flex-1 flex-col items-center justify-center gap-4">
	<div class="xs:flex hidden flex-col items-center gap-4">
		<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
			Start recording
		</h1>
		<p class="text-muted-foreground text-center">
			Click the 🎙 button to start. Allow access to your microphone.
		</p>
	</div>

	<Tabs.Root value="voice" class="w-full max-w-md">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="voice" class="font-medium">
				Voice Activated
			</Tabs.Trigger>
			<Tabs.Trigger value="manual" class="font-medium">Manual</Tabs.Trigger>
		</Tabs.List>
		<div class="mt-6">
			<Tabs.Content value="voice">
				<div class="flex items-end justify-between w-full gap-2">
					<div class="flex-1"></div>
					<WhisperingButton
						tooltipContent="Toggle recording"
						onclick={recorder.toggleRecordingWithToast}
						variant="ghost"
						class="flex-shrink-0 size-32 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
					>
						<span
							style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
							class="text-[100px] leading-none"
						>
							{recorderStateAsIcon}
						</span>
					</WhisperingButton>
					<div class="flex-1 flex-justify-center mb-2">
						<RecordingControlsOrCancelRecordingSessionOrEndRecordingSessionButton
						/>
					</div>
				</div>
			</Tabs.Content>

			<Tabs.Content value="manual">
				<div class="flex items-end justify-between w-full gap-2">
					<div class="flex-1"></div>
					<WhisperingButton
						tooltipContent="Toggle recording"
						onclick={recorder.toggleRecordingWithToast}
						variant="ghost"
						class="flex-shrink-0 size-32 transform items-center justify-center overflow-hidden duration-300 ease-in-out"
					>
						<span
							style="filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5)); view-transition-name: microphone-icon;"
							class="text-[100px] leading-none"
						>
							{recorderStateAsIcon}
						</span>
					</WhisperingButton>
					<div class="flex-1 flex-justify-center mb-2">
						<RecordingControlsOrCancelRecordingSessionOrEndRecordingSessionButton
						/>
					</div>
				</div>
			</Tabs.Content>
		</div>
	</Tabs.Root>

	<div class="xxs:flex hidden w-full max-w-80 flex-col items-center gap-2">
		{#if latestRecording.transcribedText !== ''}
			<div class="flex w-full items-center gap-2">
				<TranscribedTextDialog
					recordingId={latestRecording.id}
					transcribedText={latestRecording.transcriptionStatus ===
					'TRANSCRIBING'
						? '...'
						: latestRecording.transcribedText}
					rows={1}
				/>
				<CopyToClipboardButton
					label="transcribed text"
					copyableText={latestRecording.transcribedText}
					viewTransitionName={getRecordingTransitionId({
						recordingId: latestRecording.id,
						propertyName: 'transcribedText',
					})}
					size="default"
					variant="secondary"
					disabled={latestRecording.transcriptionStatus === 'TRANSCRIBING'}
				>
					{#snippet copyIcon()}
						{#if latestRecording.transcriptionStatus === 'TRANSCRIBING'}
							<Loader2Icon class="h-6 w-6 animate-spin" />
						{:else}
							<ClipboardIcon class="h-6 w-6" />
						{/if}
					{/snippet}
				</CopyToClipboardButton>
			</div>
		{/if}

		{#if blobUrl}
			<audio
				style="view-transition-name: {getRecordingTransitionId({
					recordingId: latestRecording.id,
					propertyName: 'blob',
				})}"
				src={blobUrl}
				controls
				class="h-8 w-full"
			></audio>
		{/if}
	</div>

	<NavItems class="xs:flex -mb-2.5 -mt-1 hidden" />

	<div class="xs:flex hidden flex-col items-center gap-3">
		<p class="text-foreground/75 text-center text-sm">
			Click the microphone or press
			{' '}<WhisperingButton
				tooltipContent="Go to local shortcut in settings"
				href="/settings#local-shortcut"
				variant="link"
				size="inline"
			>
				<kbd
					class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
				>
					{settings.value['shortcuts.currentLocalShortcut']}
				</kbd>
			</WhisperingButton>{' '}
			to start recording here.
		</p>
		{#if window.__TAURI_INTERNALS__}
			<p class="text-foreground/75 text-sm">
				Press
				{' '}<WhisperingButton
					tooltipContent="Go to global shortcut in settings"
					href="/settings#global-shortcut"
					variant="link"
					size="inline"
				>
					<kbd
						class="bg-muted relative rounded px-[0.3rem] py-[0.15rem] font-mono text-sm font-semibold"
					>
						{settings.value['shortcuts.currentGlobalShortcut']}
					</kbd>
				</WhisperingButton>{' '}
				to start recording anywhere.
			</p>
		{/if}
		<p class="text-muted-foreground text-center text-sm font-light">
			Check out the {' '}<WhisperingButton
				tooltipContent="Check out the Chrome Extension"
				href="https://chromewebstore.google.com/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo"
				target="_blank"
				rel="noopener noreferrer"
				variant="link"
				size="inline"
			>
				extension
			</WhisperingButton>{' '}
			{#if !window.__TAURI_INTERNALS__}
				and {' '}<WhisperingButton
					tooltipContent="Check out the desktop app"
					href="https://github.com/braden-w/whispering/releases"
					target="_blank"
					rel="noopener noreferrer"
					variant="link"
					size="inline"
				>
					app
				</WhisperingButton>{' '}
			{/if} for more integrations!
		</p>
	</div>
</main>
