import { Context } from 'effect';

export class RecorderWithStateService extends Context.Tag('RecorderWithStateService')<
	RecorderWithStateService,
	{
		readonly recorderState: 'IDLE' | 'RECORDING';
		selectedAudioInputDeviceId: string;
		toggleRecording: () => Promise<any>;
		cancelRecording: () => Promise<any>;
		enumerateRecordingDevices: () => Promise<MediaDeviceInfo[]>;
	}
>() {}
