<script lang="ts">
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import {
		ACCEPT_AUDIO,
		ACCEPT_VIDEO,
		FileDropZone,
		MEGABYTE,
	} from '@repo/ui/file-drop-zone';
	import { Textarea } from '@repo/ui/textarea';
	import { PaperclipIcon, X } from 'lucide-svelte';

	let {
		disabled = false,
		onFileUpload,
		onSubmit,
		placeholder = 'Type your message...',
		value = $bindable(''),
	}: {
		disabled?: boolean;
		onFileUpload?: (files: File[]) => void;
		onSubmit: () => void;
		placeholder?: string;
		value?: string;
	} = $props();

	let showFileUpload = $state(false);
	let uploadedFiles = $state<File[]>([]);

	function handleKeyDown(e: KeyboardEvent) {
		// Submit on Enter (without shift)
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (!disabled && value.trim()) {
				onSubmit();
			}
		}
	}

	function handleSubmit() {
		if (!disabled && value.trim()) {
			onSubmit();
			// Clear uploaded files after submit
			uploadedFiles = [];
			showFileUpload = false;
		}
	}

	function removeFile(file: File) {
		uploadedFiles = uploadedFiles.filter((f) => f !== file);
		if (uploadedFiles.length === 0) {
			showFileUpload = false;
		}
	}

	function handleFileDropZoneUpload(files: File[]) {
		uploadedFiles = [...uploadedFiles, ...files];
		if (onFileUpload) {
			onFileUpload(files);
		}
	}
</script>

<div class="space-y-2">
	{#if showFileUpload}
		<FileDropZone
			accept="{ACCEPT_AUDIO}, {ACCEPT_VIDEO}"
			maxFiles={5}
			maxFileSize={25 * MEGABYTE}
			onUpload={handleFileDropZoneUpload}
			class="h-24"
		/>
	{/if}

	{#if uploadedFiles.length > 0}
		<div class="flex flex-wrap gap-1">
			{#each uploadedFiles as file}
				<Badge variant="secondary" class="pr-1">
					{file.name}
					<Button
						variant="ghost"
						size="icon"
						class="h-4 w-4 ml-1 hover:bg-transparent"
						onclick={() => removeFile(file)}
					>
						<X class="h-3 w-3" />
					</Button>
				</Badge>
			{/each}
		</div>
	{/if}

	<div class="flex gap-2">
		<Textarea
			bind:value
			{placeholder}
			{disabled}
			onkeydown={handleKeyDown}
			class="min-h-[80px] resize-none flex-1"
			rows={3}
		/>
		<div class="flex flex-col gap-2">
			<Button
				variant="ghost"
				size="icon"
				onclick={() => (showFileUpload = !showFileUpload)}
				{disabled}
				class="h-9 w-9"
			>
				<PaperclipIcon class="h-4 w-4" />
			</Button>
			<Button
				onclick={handleSubmit}
				{disabled}
				size="icon"
				class="h-[41px] w-9"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M22 2L11 13" />
					<path d="M22 2L15 22L11 13L2 9L22 2Z" />
				</svg>
			</Button>
		</div>
	</div>
</div>
