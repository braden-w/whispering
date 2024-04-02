import { RecordingsDbServiceLiveIndexedDb } from '@repo/recorder/implementations/recordings-db/indexed-db.ts';
import { whisperTranscriptionService } from '@repo/recorder/implementations/transcription/whisper.ts';
import { TranscriptionService } from '@repo/recorder/services/transcription';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings';

export const recordings = createRecordings.pipe(
	Effect.provide(RecordingsDbServiceLiveIndexedDb),
	Effect.provideService(TranscriptionService, whisperTranscriptionService),
	Effect.runSync
);

recordings.sync.pipe(Effect.runPromise);
