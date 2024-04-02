import { RecordingsDbServiceLiveIndexedDb } from '@repo/services/implementations/recordings-db/indexed-db.ts';
import { TranscriptionServiceLiveWhisper } from '@repo/services/implementations/transcription/whisper.ts';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings';

export const recordings = createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provide(TranscriptionServiceLiveWhisper),
	Effect.runSync
);

recordings.sync.pipe(Effect.runPromise);
