import { webRecorderService } from '@repo/recorder/implementations/recorder/web';
import { RecorderService } from '@repo/recorder/services/recorder';
import { Effect } from 'effect';
import { createRecorder } from './create-recorder';

export const recorder = createRecorder({}).pipe(
	Effect.provideService(RecorderService, webRecorderService),
	Effect.runSync
);
