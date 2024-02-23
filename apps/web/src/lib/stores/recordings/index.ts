import { RecordingsDbService } from '@repo/recorder';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings';
import { indexedDbService } from './indexed-db-service';
import { TranscriptionService } from '@repo/recorder/services/transcription';
import { whisperTranscriptionService } from '@repo/recorder/implementations/transcription/whisper.ts';

export const recordings = createRecordings
	.pipe(Effect.provideService(RecordingsDbService, indexedDbService))
	.pipe(Effect.provideService(TranscriptionService, whisperTranscriptionService))
	.pipe(Effect.runSync);

recordings.sync.pipe(Effect.runPromise);
