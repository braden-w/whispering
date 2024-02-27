import { webRecorderService } from '@repo/recorder/implementations/recorder/web.ts';
import { RecorderService } from '@repo/recorder/services/recorder';
import { Effect } from 'effect';
import { createRecorder } from './create-recorder';

export const { recorderState, selectedAudioInputDeviceId, ...recorder } = createRecorder().pipe(
	Effect.provideService(RecorderService, webRecorderService),
	Effect.runSync
);

recorder.refreshDefaultAudioInput.pipe(Effect.runPromise);
