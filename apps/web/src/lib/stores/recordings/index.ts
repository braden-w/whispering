import { RecordingsDbService } from '@repo/recorder';
import { Effect } from 'effect';
import { createRecordings } from './create-recordings';
import { indexedDbService } from './indexed-db-service';

export const recordings = createRecordings
	.pipe(Effect.provideService(RecordingsDbService, indexedDbService))
	.pipe(Effect.runSync);
