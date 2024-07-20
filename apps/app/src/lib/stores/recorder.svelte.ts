import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { mediaStreamManager } from '$lib/services/MediaRecorderService.svelte';
import { NotificationServiceDesktopLive } from '$lib/services/NotificationServiceDesktopLive';
import { NotificationServiceWebLive } from '$lib/services/NotificationServiceWebLive';
import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { SetTrayIconServiceDesktopLive } from '$lib/services/SetTrayIconServiceDesktopLive';
import { SetTrayIconServiceWebLive } from '$lib/services/SetTrayIconServiceWebLive';
import { toast } from '$lib/services/ToastService';
import { recordings, settings } from '$lib/stores';
import { NotificationService, WhisperingError, type RecorderState } from '@repo/shared';
import AudioRecorder from 'audio-recorder-polyfill';
import { Data, Effect } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import type { Recording } from '../services/RecordingDbService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

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
		startRecording: (preferredRecordingDeviceId: string) =>
			Effect.gen(function* () {
				if (mediaRecorder) {
					return yield* new WhisperingError({
						title: 'Unexpected media recorder already exists',
						description:
							'It seems like it was not properly deinitialized after the previous stopRecording or cancelRecording call.',
					});
				}
				const connectingToRecordingDeviceToastId = nanoid();
				const newOrExistingStream =
					mediaStreamManager.stream ?? (yield* mediaStreamManager.refreshStream());
				const newMediaRecorder = yield* Effect.try({
					try: () =>
						new AudioRecorder(newOrExistingStream, {
							mimeType: 'audio/webm;codecs=opus',
							sampleRate: 16000,
						}) as MediaRecorder,
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
							return new AudioRecorder(stream, {
								mimeType: 'audio/webm;codecs=opus',
								sampleRate: 16000,
							}) as MediaRecorder;
						}),
					),
				);
				newMediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
					if (!event.data.size) return;
					recordedChunks.push(event.data);
				});
				newMediaRecorder.start();
				mediaRecorder = newMediaRecorder;
			}),
		stopRecording: Effect.async<Blob, Error>((resume) => {
			if (!mediaRecorder) return;
			mediaRecorder.addEventListener('stop', () => {
				const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
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
				if (!settings.apiKey) {
					return yield* new WhisperingError({
						title: 'API Key not provided.',
						description: 'Please enter your OpenAI API key in the settings',
						action: {
							label: 'Go to settings',
							goto: '/settings',
						},
					});
				}

				switch (mediaRecorderService.recordingState) {
					case 'inactive':
						yield* mediaRecorderService.startRecording(settings.selectedAudioInputDeviceId);
						yield* Effect.all([
							Effect.sync(() => (recorderState.value = 'RECORDING')),
							Effect.logInfo('Recording started'),
							Effect.gen(function* () {
								if (settings.isPlaySoundEnabled) {
									if (!document.hidden) {
										startSound.play();
									} else {
										yield* sendMessageToExtension({
											name: 'external/playSound',
											body: { sound: 'start' },
										});
									}
								}
							}).pipe(Effect.catchAll(renderErrorAsToast)),
							notify({
								id: IS_RECORDING_NOTIFICATION_ID,
								title: 'Whispering is recording...',
								description: 'Click to go to recorder',
								action: {
									label: 'Go to recorder',
									goto: '/',
								},
							}).pipe(Effect.catchAll(renderErrorAsToast)),
						]);
						return;
					case 'recording':
						const audioBlob = yield* mediaRecorderService.stopRecording;
						yield* Effect.all([
							Effect.sync(() => (recorderState.value = 'IDLE')),
							Effect.logInfo('Recording stopped'),
							Effect.gen(function* () {
								if (settings.isPlaySoundEnabled) {
									if (!document.hidden) {
										stopSound.play();
									} else {
										yield* sendMessageToExtension({
											name: 'external/playSound',
											body: { sound: 'stop' },
										});
									}
								}
							}).pipe(Effect.catchAll(renderErrorAsToast)),
							Effect.gen(function* () {
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
								recordings.transcribeRecording(newRecording.id);
							}).pipe(Effect.catchAll(renderErrorAsToast)),
						]);
						return;
				}
			}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise),
		cancelRecording: () =>
			Effect.gen(function* () {
				yield* mediaRecorderService.cancelRecording;
				if (settings.isPlaySoundEnabled) {
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
			}).pipe(Effect.runPromise),
	};
}).pipe(
	Effect.provide(window.__TAURI__ ? NotificationServiceDesktopLive : NotificationServiceWebLive),
	Effect.runSync,
);
