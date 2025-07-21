<script lang="ts">
	import type { Part } from '$lib/client/types.gen';
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import { Download, File, Image, Video, Music } from 'lucide-svelte';
	import { parseMarkdown } from '$lib/utils/markdown';

	let { part }: { part: Part } = $props();

	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) return Image;
		if (mimeType.startsWith('video/')) return Video;
		if (mimeType.startsWith('audio/')) return Music;
		return File;
	}

	function formatFileSize(url: string): string {
		// This would need to be implemented based on how file sizes are stored
		// For now, return empty string
		return '';
	}

	function downloadFile(url: string, filename?: string) {
		const link = document.createElement('a');
		link.href = url;
		if (filename) {
			link.download = filename;
		}
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

{#if part.type === 'text'}
	<div class="break-words">
		{@html parseMarkdown(part.text)}
		{#if part.synthetic}
			<Badge variant="secondary" class="ml-2 text-xs">Synthetic</Badge>
		{/if}
	</div>
{:else if part.type === 'file'}
	{@const FileIcon = getFileIcon(part.mime)}
	<div class="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
		<div class="flex-shrink-0">
			<FileIcon class="h-5 w-5 text-muted-foreground" />
		</div>
		<div class="flex-1 min-w-0">
			<div class="font-medium text-sm truncate">
				{part.filename ?? 'Untitled file'}
			</div>
			<div class="text-xs text-muted-foreground">
				{part.mime}
				{#if formatFileSize(part.url)}
					• {formatFileSize(part.url)}
				{/if}
			</div>
		</div>
		<Button
			variant="ghost"
			size="sm"
			onclick={() => downloadFile(part.url, part.filename)}
			class="flex-shrink-0"
		>
			<Download class="h-4 w-4" />
		</Button>
	</div>
{:else if part.type === 'step-start'}
	<div class="flex items-center gap-2 text-sm text-muted-foreground border-l-2 border-primary pl-3 py-1">
		<div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
		<span>Starting step...</span>
	</div>
{:else if part.type === 'step-finish'}
	<div class="flex items-center justify-between text-sm text-muted-foreground border-l-2 border-green-500 pl-3 py-1">
		<div class="flex items-center gap-2">
			<div class="w-2 h-2 bg-green-500 rounded-full"></div>
			<span>Step completed</span>
		</div>
		<div class="flex items-center gap-2 text-xs">
			{#if part.cost > 0}
				<span>${part.cost.toFixed(4)}</span>
				<span>•</span>
			{/if}
			<span class="font-mono">Step: {part.tokens.input}→{part.tokens.output}</span>
		</div>
	</div>
{/if}