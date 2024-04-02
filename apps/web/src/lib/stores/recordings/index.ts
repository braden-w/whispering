import { RecordingsDbServiceLiveIndexedDb } from '@repo/recorder/implementations/recordings-db/indexed-db.ts';
import { TranscriptionServiceLiveWhisper } from '@repo/recorder/implementations/transcription/whisper.ts';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings';

export const recordings = createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provide(TranscriptionServiceLiveWhisper),
	Effect.runSync
);

recordings.sync.pipe(Effect.runPromise);
