import { RecorderServiceLiveWeb } from '@repo/services/implementations/recorder/web.ts';
import { Effect } from 'effect';
import { createRecorder } from './create-recorder';

export const { recorderState, selectedAudioInputDeviceId, ...recorder } = createRecorder().pipe(
	Effect.provide(RecorderServiceLiveWeb),
	Effect.runSync
);

recorder.refreshDefaultAudioInput.pipe(Effect.runPromise);
