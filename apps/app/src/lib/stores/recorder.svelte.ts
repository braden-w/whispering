import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { mediaStreamManager } from '$lib/services/MediaRecorderService.svelte';
import { NotificationServiceDesktopLive } from '$lib/services/NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from '$lib/services/NotificationServiceWebLive';
import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { SetTrayIconServiceDesktopLive } from '$lib/services/SetTrayIconServiceDesktopLive';
import { SetTrayIconServiceWebLive } from '$lib/services/SetTrayIconServiceWebLive';
import { toast } from '$lib/services/ToastService';
import { recordings } from '$lib/stores/recordings.svelte';
import { settings } from '$lib/stores/settings.svelte';
import { NotificationService, WhisperingError, type RecorderState } from '@repo/shared';
import { Data, Effect } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import type { Recording } from '../services/RecordingDbService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { setAlwaysOnTop } from '$lib/services/AlwaysOnTopService';

const TIMESLICE_MS = 1000;

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

class TryResuseStreamError extends Data.TaggedError('TryResuseStreamError') {}

const MediaRecorderService = Effect.gen(function* () {
	let mediaRecorder: MediaRecorder | null = null;
	const recordedChunks: Blob[] = [];

	const resetRecorder = () => {
		recordedChunks.length = 0;
		mediaRecorder = null;
	};

	return {
		get recordingState() {
			if (!mediaRecorder) return 'inactive';
			return mediaRecorder.state;
		},
		startRecording: () =>
			Effect.gen(function* () {
				if (mediaRecorder) {
					return yield* new WhisperingError({
						title: 'Unexpected media recorder already exists',
						description:
							'It seems like it was not properly deinitialized after the previous stopRecording or cancelRecording call.',
					});
				}
				const connectingToRecordingDeviceToastId = nanoid();
				const newOrExistingStream = yield* mediaStreamManager.getOrRefreshStream();
				const newMediaRecorder = yield* Effect.try({
					try: () =>
						new MediaRecorder(newOrExistingStream, { bitsPerSecond: settings.value.bitsPerSecond }),
					catch: () => new TryResuseStreamError(),
				}).pipe(
					Effect.catchAll(() =>
						Effect.gen(function* () {
							yield* toast({
								id: connectingToRecordingDeviceToastId,
								variant: 'loading',
								title: 'Error initializing media recorder with preferred device',
								description: 'Trying to find another available audio input device...',
							});
							const stream = yield* mediaStreamManager.refreshStream();
							return new MediaRecorder(stream, { bitsPerSecond: settings.value.bitsPerSecond });
						}),
					),
				);
				newMediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
					if (!event.data.size) return;
					recordedChunks.push(event.data);
				});
				newMediaRecorder.start(TIMESLICE_MS);
				mediaRecorder = newMediaRecorder;
			}),
		stopRecording: Effect.async<Blob, Error>((resume) => {
			if (!mediaRecorder) return;
			mediaRecorder.addEventListener('stop', () => {
				if (!mediaRecorder) return;
				const audioBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
				resume(Effect.succeed(audioBlob));
				resetRecorder();
			});
			mediaRecorder.stop();
		}).pipe(
			Effect.catchAll((error) => {
				resetRecorder();
				return new WhisperingError({
					title: 'Error canceling media recorder',
					description: error instanceof Error ? error.message : 'Please try again',
					error: error,
				});
			}),
		),
		cancelRecording: Effect.async<undefined, Error>((resume) => {
			if (!mediaRecorder) return;
			mediaRecorder.addEventListener('stop', () => {
				resetRecorder();
				resume(Effect.succeed(undefined));
			});
			mediaRecorder.stop();
		}).pipe(
			Effect.catchAll((error) => {
				resetRecorder();
				return new WhisperingError({
					title: 'Error stopping media recorder',
					description: error instanceof Error ? error.message : 'Please try again',
					error: error,
				});
			}),
		),
	};
});

export let recorderState = Effect.gen(function* () {
	const { setTrayIcon } = yield* SetTrayIconService;
	let value = $state<RecorderState>('IDLE');
	return {
		get value() {
			return value;
		},
		set value(newValue: RecorderState) {
			value = newValue;
			setTrayIcon(newValue).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);
		},
	};
}).pipe(
	Effect.provide(window.__TAURI__ ? SetTrayIconServiceDesktopLive : SetTrayIconServiceWebLive),
	Effect.runSync,
);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = Effect.gen(function* () {
	const mediaRecorderService = yield* MediaRecorderService;
	const { notify } = yield* NotificationService;

	return {
		get recorderState() {
			return recorderState.value;
		},
		toggleRecording: () =>
			Effect.gen(function* () {
				switch (mediaRecorderService.recordingState) {
					case 'inactive':
						if (settings.value.alwaysOnTop === 'When Recording') {
							yield* setAlwaysOnTop(true);
						}
						yield* mediaRecorderService.startRecording();
						recorderState.value = 'RECORDING';
						yield* Effect.logInfo('Recording started');
						if (settings.value.isPlaySoundEnabled) {
							if (!document.hidden) {
								startSound.play();
							} else {
								yield* sendMessageToExtension({
									name: 'external/playSound',
									body: { sound: 'start' },
								}).pipe(Effect.catchAll(renderErrorAsToast));
							}
						}
						yield* notify({
							id: IS_RECORDING_NOTIFICATION_ID,
							title: 'Whispering is recording...',
							description: 'Click to go to recorder',
							action: {
								label: 'Go to recorder',
								goto: '/',
							},
						}).pipe(Effect.catchAll(renderErrorAsToast));
						return;
					case 'recording':
						const audioBlob = yield* mediaRecorderService.stopRecording;
						recorderState.value = 'IDLE';
						yield* Effect.logInfo('Recording stopped');

						if (settings.value.isPlaySoundEnabled) {
							if (!document.hidden) {
								stopSound.play();
							} else {
								yield* sendMessageToExtension({
									name: 'external/playSound',
									body: { sound: 'stop' },
								}).pipe(Effect.catchAll(renderErrorAsToast));
							}
						}

						const newRecording: Recording = {
							id: nanoid(),
							title: '',
							subtitle: '',
							timestamp: new Date().toISOString(),
							transcribedText: '',
							blob: audioBlob,
							transcriptionStatus: 'UNPROCESSED',
						};
						yield* recordings.addRecording(newRecording);

						yield* recordings.transcribeRecording(newRecording.id);
						if (settings.value.alwaysOnTop === 'When Recording') {
							yield* setAlwaysOnTop(false);
						}
				}
			}).pipe(
				Effect.tapError(() =>
					Effect.gen(function* () {
						recorderState.value = 'IDLE';
						if (settings.value.alwaysOnTop === 'When Recording') {
							yield* setAlwaysOnTop(false);
						}
					}),
				),
				Effect.catchAll(renderErrorAsToast),
				Effect.runPromise,
			),
		cancelRecording: () =>
			Effect.gen(function* () {
				yield* mediaRecorderService.cancelRecording;
				if (settings.value.isPlaySoundEnabled) {
					if (!document.hidden) {
						cancelSound.play();
					} else {
						yield* sendMessageToExtension({
							name: 'external/playSound',
							body: { sound: 'cancel' },
						});
					}
				}
				yield* Effect.logInfo('Recording cancelled');
				recorderState.value = 'IDLE';
				if (settings.value.alwaysOnTop === 'When Recording') {
					yield* setAlwaysOnTop(false);
				}
			}).pipe(Effect.runPromise),
	};
}).pipe(
	Effect.provide(window.__TAURI__ ? NotificationServiceDesktopLive : NotificationServiceWebLive),
	Effect.runSync,
);
