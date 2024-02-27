import { clipboardService } from '@repo/recorder/implementations/clipboard/web.ts';
import { ClipboardService } from '@repo/recorder/services/clipboard';
import type { Recording } from '@repo/recorder/services/recordings-db';
import { toast } from '@repo/ui/components/sonner';
import { Effect } from 'effect';

export const clipboard = ClipboardService.pipe(
	Effect.provideService(ClipboardService, clipboardService),
	Effect.runSync
);

export const copyRecordingText = (recording: Recording) =>
	Effect.gen(function* (_) {
		if (!recording.transcribedText) return;
		yield* _(clipboard.setClipboardText(recording.transcribedText));
		toast.success('Copied to clipboard!');
	}).pipe(Effect.runPromise);
