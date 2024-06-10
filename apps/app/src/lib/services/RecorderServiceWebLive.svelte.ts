import { goto } from '$app/navigation';
import { recordings, settings } from '$lib/stores';
import AudioRecorder from 'audio-recorder-polyfill';
import { Effect, Layer } from 'effect';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';
import { RecorderError, RecorderService, type RecorderState } from './RecorderService';
import type { Recording } from './RecordingDbService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { catchErrorsAsToast } from './errors';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const getStream = (recordingDeviceId: string) =>
	Effect.tryPromise({
		try: () =>
			navigator.mediaDevices.getUserMedia({
				audio: { deviceId: { exact: recordingDeviceId } },
			}),
		catch: (error) =>
			new RecorderError({
				title: 'Error getting media stream',
				error: error,
			}),
	});

const enumerateRecordingDevices = Effect.tryPromise({
	try: async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const devices = await navigator.mediaDevices.enumerateDevices();
		stream.getTracks().forEach((track) => track.stop());
		const audioInputDevices = devices.filter((device) => device.kind === 'audioinput');
		return audioInputDevices;
	},
	catch: (error) =>
		new RecorderError({
			title: 'Error enumerating recording devices',
			description: 'Please make sure you have given permission to access your audio devices',
			error: error,
		}),
});

export const RecorderServiceWebLive = Layer.effect(
	RecorderService,
	Effect.gen(function* () {
		let stream: MediaStream | null = null;
		let mediaRecorder: MediaRecorder | null = null;
		const recordedChunks: Blob[] = [];

		let recorderState = $state<RecorderState>('IDLE');

		const resetRecorder = () => {
			recordedChunks.length = 0;
			stream?.getTracks().forEach((track) => track.stop());
			stream = null;
			mediaRecorder = null;
		};

		const startRecording = (recordingDeviceId: string) =>
			Effect.gen(function* () {
				stream = yield* getStream(recordingDeviceId);
				recordedChunks.length = 0;
				mediaRecorder = new AudioRecorder(stream!);
				(mediaRecorder!.ondataavailable = (event: BlobEvent) => {
					if (!event.data.size) return;
					recordedChunks.push(event.data);
				}),
					mediaRecorder!.start();
			});

		const stopRecording = Effect.tryPromise({
			try: () =>
				new Promise<Blob>((resolve) => {
					if (!mediaRecorder) {
						throw new RecorderError({
							title: 'Media recorder is not initialized',
						});
					}
					mediaRecorder.addEventListener(
						'stop',
						() => {
							const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
							resolve(audioBlob);
							resetRecorder();
						},
						{ once: true },
					);
					mediaRecorder.stop();
				}),
			catch: (error) =>
				new RecorderError({
					title: 'Error stopping media recorder and getting audio blob',
					error: error,
				}),
		}).pipe(
			Effect.catchAll((error) => {
				resetRecorder();
				return error;
			}),
		);

		return {
			get recorderState() {
				return recorderState;
			},
			enumerateRecordingDevices: () =>
				enumerateRecordingDevices.pipe(
					(program) => catchErrorsAsToast(program, [] satisfies MediaDeviceInfo[]),
					Effect.runPromise,
				),
			toggleRecording: () =>
				Effect.gen(function* () {
					if (!settings.apiKey) {
						return yield* new RecorderError({
							title: 'API Key not provided.',
							description: 'Please enter your OpenAI API key in the settings',
							action: {
								label: 'Go to settings',
								onClick: () => goto('/settings'),
							},
						});
					}
					const recordingDevices = yield* enumerateRecordingDevices;
					const isSelectedDeviceExists = recordingDevices.some(
						({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
					);
					if (!isSelectedDeviceExists) {
						toast.info('Default audio input device not found, selecting first available device');
						const firstAudioInput = recordingDevices[0].deviceId;
						settings.selectedAudioInputDeviceId = firstAudioInput;
					}
					yield* Effect.logInfo('Media recorder state:', mediaRecorder?.state);
					if (!mediaRecorder || mediaRecorder.state === 'inactive') {
						yield* startRecording(settings.selectedAudioInputDeviceId);
						if (settings.isPlaySoundEnabled) startSound.play();
						yield* Effect.logInfo('Recording started');
						recorderState = 'RECORDING';
						return;
					} else if (mediaRecorder.state === 'paused') {
						mediaRecorder.resume();
						recorderState = 'RECORDING';
						return;
					} else if (mediaRecorder.state === 'recording') {
						const audioBlob = yield* stopRecording;
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
				}).pipe(catchErrorsAsToast, Effect.runPromise),
			cancelRecording: () =>
				Effect.gen(function* () {
					if (!mediaRecorder) return;
					if (mediaRecorder.state !== 'recording') return;
					mediaRecorder.stop();
					resetRecorder();
					if (settings.isPlaySoundEnabled) cancelSound.play();
					yield* Effect.logInfo('Recording cancelled');
					recorderState = 'IDLE';
				}).pipe(Effect.runSync),
		};
	}),
);
