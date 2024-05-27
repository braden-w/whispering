import { ClipboardServiceLive } from '@repo/services/implementations/clipboard/web.js';
import { RecordingsDbServiceLiveIndexedDb } from '@repo/services/implementations/recordings-db/indexed-db.svelte.ts';
import { TranscriptionServiceLiveWhisper } from '@repo/services/implementations/transcription/whisper.ts';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings.svelte';

export const recordings = createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provide(TranscriptionServiceLiveWhisper),
	Effect.provide(ClipboardServiceLive),
	Effect.runSync,
);

recordings.sync.pipe(Effect.runPromise);
