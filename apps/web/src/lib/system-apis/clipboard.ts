import { Effect } from 'effect';
import { ClipboardService } from '@repo/recorder/services/clipboard';
import { clipboardService } from '@repo/recorder/implementations/clipboard/web';

export const clipboard = ClipboardService.pipe(
	Effect.provideService(ClipboardService, clipboardService),
	Effect.runSync
);
