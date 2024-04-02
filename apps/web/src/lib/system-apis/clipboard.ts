import { ClipboardServiceLive } from '@repo/services/implementations/clipboard/web.js';
import { ClipboardService } from '@repo/services/services/clipboard';
import type { Recording } from '@repo/services/services/recordings-db';
import { Effect } from 'effect';
import { toast } from 'svelte-french-toast';

export const copyRecordingText = (recording: Recording) =>
	Effect.gen(function* (_) {
		if (!recording.transcribedText) return;
		const clipboardService = yield* _(ClipboardService);
		yield* _(clipboardService.setClipboardText(recording.transcribedText));
		toast.success('Copied to clipboard!');
	}).pipe(Effect.provide(ClipboardServiceLive), Effect.runPromise);
