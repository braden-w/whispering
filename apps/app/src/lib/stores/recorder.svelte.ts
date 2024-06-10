import { goto } from '$app/navigation';
import { recordings, settings } from '$lib/stores';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';
import {
	MediaRecorderError,
	MediaRecorderService,
	type RecorderState,
} from '../services/MediaRecorderService';
import type { Recording } from '../services/RecordingDbService';
import { catchErrorsAsToast } from '../services/errors';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { MediaRecorderServiceWebLive } from '$lib/services/MediaRecorderServiceWebLive';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export const recorder = Effect.gen(function* () {
	const mediaRecorderService = yield* MediaRecorderService;

	let recorderState = $state<RecorderState>('IDLE');

	return {
		get recorderState() {
			return recorderState;
		},
		enumerateRecordingDevices: () =>
			mediaRecorderService.enumerateRecordingDevices.pipe(
				(program) => catchErrorsAsToast(program, { defaultValue: [] as MediaDeviceInfo[] }),
				Effect.runPromise,
			),
		toggleRecording: () =>
			Effect.gen(function* () {
				if (!settings.apiKey) {
					return yield* new MediaRecorderError({
						title: 'API Key not provided.',
						description: 'Please enter your OpenAI API key in the settings',
						action: {
							label: 'Go to settings',
							onClick: () => goto('/settings'),
						},
					});
				}
				const recordingDevices = yield* mediaRecorderService.enumerateRecordingDevices;
				const isSelectedDeviceExists = recordingDevices.some(
					({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
				);
				if (!isSelectedDeviceExists) {
					toast.info('Default audio input device not found, selecting first available device');
					const firstAudioInput = recordingDevices[0].deviceId;
					settings.selectedAudioInputDeviceId = firstAudioInput;
				}
				switch (mediaRecorderService.recorderState) {
					case 'IDLE': {
						yield* mediaRecorderService.startRecording(settings.selectedAudioInputDeviceId);
						if (settings.isPlaySoundEnabled) startSound.play();
						yield* Effect.logInfo('Recording started');
						recorderState = 'RECORDING';
						return;
					}
					case 'RECORDING': {
						const audioBlob = yield* mediaRecorderService.stopRecording;
						if (settings.isPlaySoundEnabled) stopSound.play();
						yield* Effect.logInfo('Recording stopped');
						const newRecording: Recording = {
							id: nanoid(),
							title: '',
							subtitle: '',
							timestamp: new Date().toISOString(),
							transcribedText: '',
							blob: audioBlob,
							transcriptionStatus: 'UNPROCESSED',
						};
						recorderState = 'IDLE';
						yield* recordings.addRecording(newRecording);
						recordings.transcribeRecording(newRecording.id);
						return;
					}
				}
			}).pipe(catchErrorsAsToast, Effect.runPromise),
		cancelRecording: () =>
			Effect.gen(function* () {
				yield* mediaRecorderService.cancelRecording;
				if (settings.isPlaySoundEnabled) cancelSound.play();
				yield* Effect.logInfo('Recording cancelled');
				recorderState = 'IDLE';
			}).pipe(Effect.runSync),
	};
}).pipe(Effect.provide(MediaRecorderServiceWebLive), Effect.runSync);
