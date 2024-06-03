import { Context } from 'effect';
import type { RecorderState } from './recorder';

export class RecorderWithStateService extends Context.Tag('RecorderWithStateService')<
	RecorderWithStateService,
	{
		readonly recorderState: RecorderState;
		toggleRecording: () => Promise<any>;
		cancelRecording: () => Promise<any>;
		enumerateRecordingDevices: () => Promise<MediaDeviceInfo[]>;
	}
>() {}
