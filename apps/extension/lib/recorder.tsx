// import { recordings, settings } from '~lib/stores';
// import { createPersistedState } from '~lib/utils/createPersistedState.svelte';
import { sendMessageToBackground } from '~lib/utils/messaging';
import { RecorderServiceLiveWeb } from '../../../packages/services/src/implementations/recorder';
import { RecorderService } from '../../../packages/services/src/services/recorder';
import type { CreateRecorderState } from '../../../packages/services/src/services/recorder-state';
// import type { Recording } from '@repo/services/services/recordings-db';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import stopSoundSrc from 'data-base64:~assets/sound_ex_machina_Button_Blip.mp3';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import startSoundSrc from 'data-base64:~assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from 'data-base64:~assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
// import { toast } from 'svelte-sonner';
import { z } from 'zod';
import { useAtom } from 'jotai';
import {
	atomWithStorage,
	unstable_withStorageValidator as withStorageValidator,
} from 'jotai/utils';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

/**
 * The transcription status of the recorder, which can be one of 'IDLE', 'RECORDING', or 'SAVING'.
 */

const INITIAL_STATE = 'IDLE';

const recorderStateAtom = atomWithStorage<'IDLE' | 'RECORDING'>(
	'whispering-recorder-state',
	INITIAL_STATE,
);
const selectedAudioInputDeviceIdAtom = atomWithStorage(
	'whispering-selected-audio-input-device-id',
	'',
);

export const useRecorder = () =>
	Effect.gen(function* () {
		const recorderService = yield* RecorderService;
		let [recorderState] = useAtom(recorderStateAtom);
		const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useAtom(
			selectedAudioInputDeviceIdAtom,
		);
		const checkAndUpdateSelectedAudioInputDevice = Effect.gen(function* () {
			const recordingDevices = yield* recorderService.enumerateRecordingDevices;
			const isSelectedDeviceExists = recordingDevices.some(
				({ deviceId }) => deviceId === selectedAudioInputDeviceId,
			);
			if (!isSelectedDeviceExists) {
				// toast.info('Default audio input device not found, selecting first available device');
				const firstAudioInput = recordingDevices[0].deviceId;
				setSelectedAudioInputDeviceId(firstAudioInput);
			}
		}).pipe(
			Effect.catchAll((error) => {
				// toast.error(error.message);
				return Effect.succeed(undefined);
			}),
		);

		return {
			get recorderState() {
				return recorderState;
			},
			get selectedAudioInputDeviceId() {
				return selectedAudioInputDeviceId;
			},
			set selectedAudioInputDeviceId(value: string) {
				setSelectedAudioInputDeviceId(value);
			},
			toggleRecording: () =>
				Effect.gen(function* () {
					if (!settings.apiKey) {
						alert('Please set your API key in the extension options');
						openOptionsPage();
						return;
					}
					yield* checkAndUpdateSelectedAudioInputDevice;
					switch (recorderState) {
						case 'IDLE': {
							yield* recorderService.startRecording(selectedAudioInputDeviceId.value);
							if (settings.isPlaySoundEnabled) startSound.play();
							chrome.action.setIcon({ path: redLargeSquare });
							yield* Effect.logInfo('Recording started');
							recorderState = 'RECORDING';
							break;
						}
						case 'RECORDING': {
							const audioBlob = yield* recorderService.stopRecording;
							if (settings.isPlaySoundEnabled) stopSound.play();
							chrome.action.setIcon({ path: studioMicrophone });
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
							break;
						}
					}
				}).pipe(
					Effect.catchAll((error) => {
						// toast.error(error.message);
						return Effect.succeed(undefined);
					}),
					Effect.runPromise,
				),
			cancelRecording: () =>
				Effect.gen(function* () {
					yield* recorderService.cancelRecording;
					if (recorderState === 'RECORDING' && settings.isPlaySoundEnabled) cancelSound.play();
					yield* Effect.logInfo('Recording cancelled');
					recorderState = 'IDLE';
				}).pipe(
					Effect.catchAll((error) => {
						// toast.error(error.message);
						return Effect.succeed(undefined);
					}),
					Effect.runPromise,
				),
			enumerateRecordingDevices: () =>
				Effect.gen(function* () {
					return yield* recorderService.enumerateRecordingDevices;
				}).pipe(
					Effect.catchAll((error) => {
						// toast.error(error.message);
						return Effect.succeed([] as MediaDeviceInfo[]);
					}),
					Effect.runPromise,
				),
		};
	}).pipe(Effect.provide(RecorderServiceLiveWeb), Effect.runSync);

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
