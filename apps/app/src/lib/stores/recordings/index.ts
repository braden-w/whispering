import { ClipboardServiceLive } from '@repo/services/implementations/clipboard/web.js';
import { RecordingsDbServiceLiveIndexedDb } from '@repo/services/implementations/recordings-db/indexed-db.ts';
import { TranscriptionServiceLiveWhisper } from '@repo/services/implementations/transcription/whisper.ts';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings.svelte';

export const recordings = await createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provide(TranscriptionServiceLiveWhisper),
	Effect.provide(ClipboardServiceLive),
	Effect.runPromise,
);

recordings.sync.pipe(Effect.runPromise);
