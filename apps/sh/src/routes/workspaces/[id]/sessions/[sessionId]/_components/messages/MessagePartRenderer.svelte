<script lang="ts">
	import type { Part } from '$lib/client/types.gen';

	import { parseMarkdown } from '$lib/utils/markdown';
	import { Badge } from '@repo/ui/badge';
	import { Button } from '@repo/ui/button';
	import { Download, File, Image, Music, Video, Camera } from 'lucide-svelte';
	import ToolExecutionDisplay from './ToolExecutionDisplay.svelte';

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
	<div class="my-3">
		<div class="flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
			<div class="flex-shrink-0">
				<FileIcon class="h-5 w-5 text-muted-foreground" />
			</div>
			<div class="flex-1 min-w-0">
				<div class="font-medium text-sm truncate">
					{part.filename ?? 'Untitled file'}
				</div>
				<div class="text-xs text-muted-foreground mt-0.5">
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
				class="flex-shrink-0 hover:bg-background"
			>
				<Download class="h-4 w-4" />
			</Button>
		</div>
	</div>
{:else if part.type === 'step-start'}
	<div class="my-2">
		<div class="flex items-center gap-3 text-sm text-muted-foreground border-l-4 border-primary/60 bg-primary/5 pl-4 py-2 rounded-r">
			<div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
			<span class="font-medium">Starting step...</span>
		</div>
	</div>
{:else if part.type === 'step-finish'}
	<div class="my-2">
		<div class="flex items-center justify-between text-sm border-l-4 border-green-500/60 bg-green-500/5 pl-4 py-2 rounded-r">
			<div class="flex items-center gap-3">
				<div class="w-2 h-2 bg-green-500 rounded-full"></div>
				<span class="font-medium text-green-700 dark:text-green-400">Step completed</span>
			</div>
			<div class="flex items-center gap-3 text-xs text-muted-foreground">
				{#if part.cost > 0}
					<span class="font-medium">${part.cost.toFixed(4)}</span>
				{/if}
				<span class="font-mono bg-muted/50 px-2 py-1 rounded text-xs">
					{part.tokens.input}→{part.tokens.output}
				</span>
			</div>
		</div>
	</div>
{:else if part.type === 'tool'}
	<div class="my-3">
		<ToolExecutionDisplay toolPart={part} />
	</div>
{:else if part.type === 'snapshot'}
	<div class="my-3">
		<div class="flex items-start gap-3 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
			<div class="flex-shrink-0 mt-0.5">
				<Camera class="h-5 w-5 text-blue-600 dark:text-blue-400" />
			</div>
			<div class="flex-1 min-w-0">
				<div class="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
					System Snapshot
				</div>
				<div class="relative">
					<pre class="text-xs text-blue-800 dark:text-blue-200 font-mono bg-white/80 dark:bg-blue-950/50 p-3 rounded border border-blue-200/50 dark:border-blue-700/50 overflow-x-auto whitespace-pre-wrap break-words">{part.snapshot}</pre>
				</div>
			</div>
		</div>
	</div>
{/if}
