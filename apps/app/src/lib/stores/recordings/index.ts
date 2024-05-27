import {
	ClipboardServiceWebLive,
	ClipboardServiceDesktopLive,
} from '@repo/services/implementations/clipboard';
import { RecordingsDbServiceLiveIndexedDb } from '@repo/services/implementations/recordings-db';
import { TranscriptionServiceLiveWhisper } from '@repo/services/implementations/transcription';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings.svelte';

export const recordings = createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provide(TranscriptionServiceLiveWhisper),
	Effect.provide(window.__TAURI__ ? ClipboardServiceDesktopLive : ClipboardServiceWebLive),
	Effect.runSync,
);

recordings.sync.pipe(Effect.runPromise);
