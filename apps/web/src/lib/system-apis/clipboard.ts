import { clipboardService } from '@repo/recorder/implementations/clipboard/web.ts';
import { ClipboardService } from '@repo/recorder/services/clipboard';
import { Effect } from 'effect';

export const clipboard = ClipboardService.pipe(
	Effect.provideService(ClipboardService, clipboardService),
	Effect.runSync
);
