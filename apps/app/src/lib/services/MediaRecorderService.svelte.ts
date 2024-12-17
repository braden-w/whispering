import { settings } from '$lib/stores/settings.svelte.js';
import { WhisperingError } from '@repo/shared';
import { Data, Effect, Option } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import { toast } from './ToastService.js';
import { renderErrorAsToast } from './renderErrorAsToast.js';

type MediaStreamManager = {
	readonly isStreamValid: boolean | undefined;
	getOrRefreshStream(): Effect.Effect<MediaStream, WhisperingError, never>;
	refreshStream(): Effect.Effect<MediaStream, WhisperingError, never>;
	release(): void;
};

export const mediaStreamManager = createMediaStreamManager();

function createMediaStreamManager(): MediaStreamManager {
	let currentStream = $state<MediaStream | null>(null);
	return {
		get isStreamValid() {
			return currentStream?.active;
		},
		getOrRefreshStream(): Effect.Effect<MediaStream, WhisperingError, never> {
			return Effect.gen(this, function* () {
				if (currentStream === null) return yield* this.refreshStream();
				if (!currentStream.active) {
					toast({
						variant: 'warning',
						title: 'Open stream is inactive',
						description: 'Refreshing recording session...',
					});
					return yield* this.refreshStream();
				}
				const validStream = currentStream as MediaStream;
				return validStream;
			});
		},
		refreshStream() {
			this.release();
			const toastId = nanoid();
			return Effect.gen(function* () {
				toast({
					id: toastId,
					variant: 'loading',
					title: 'Connecting to selected audio input device...',
					description: 'Please allow access to your microphone if prompted.',
				});
				if (!settings.value.selectedAudioInputDeviceId) {
					toast({
						id: toastId,
						variant: 'loading',
						title: 'No device selected',
						description: 'Defaulting to first available audio input device...',
					});
					const firstAvailableStream = yield* getFirstAvailableStream;
					currentStream = firstAvailableStream;
					toast({
						id: toastId,
						variant: 'info',
						title: 'Defaulted to first available audio input device',
						description: 'You can select a specific device in the settings.',
					});
					return firstAvailableStream;
				}
				const maybeStream = yield* getStreamForDeviceId(
					settings.value.selectedAudioInputDeviceId,
				);
				if (Option.isSome(maybeStream)) {
					currentStream = maybeStream.value;
					toast({
						id: toastId,
						variant: 'success',
						title: 'Connected to selected audio input device',
						description: 'Successfully connected to your microphone stream.',
					});
					return maybeStream.value;
				}
				toast({
					id: toastId,
					variant: 'loading',
					title: 'Error connecting to selected audio input device',
					description: 'Trying to find another available audio input device...',
				});
				const firstAvailableStream = yield* getFirstAvailableStream;
				currentStream = firstAvailableStream;
				toast({
					id: toastId,
					variant: 'info',
					title: 'Defaulted to first available audio input device',
					description: 'You can select a specific device in the settings.',
				});
				return firstAvailableStream;
			}).pipe(Effect.tapError(renderErrorAsToast));
		},
		release() {
			if (currentStream === null) return;
			for (const track of currentStream.getTracks()) {
				track.stop();
			}
			currentStream = null;
		},
	};
}

export const enumerateRecordingDevices = Effect.tryPromise({
	try: async () => {
		const allAudioDevicesStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		const devices = await navigator.mediaDevices.enumerateDevices();
		for (const track of allAudioDevicesStream.getTracks()) {
			track.stop();
		}
		const audioInputDevices = devices.filter(
			(device) => device.kind === 'audioinput',
		);
		return audioInputDevices;
	},
	catch: (error) =>
		new WhisperingError({
			title: 'Error enumerating recording devices',
			description:
				'Please make sure you have given permission to access your audio devices',
			action: {
				type: 'more-details',
				error,
			},
		}),
});

class GetStreamError extends Data.TaggedError('GetStreamError')<{
	recordingDeviceId: string;
}> {}

const getStreamForDeviceId = (recordingDeviceId: string) =>
	Effect.tryPromise({
		try: async () => {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					deviceId: { exact: recordingDeviceId },
					channelCount: 1, // Mono audio is usually sufficient for voice recording
					sampleRate: 16000, // 16 kHz is a good balance for voice
				},
			});
			return Option.some(stream);
		},
		catch: () => new GetStreamError({ recordingDeviceId }),
	}).pipe(Effect.catchAll(() => Effect.succeed(Option.none<MediaStream>())));

const getFirstAvailableStream = Effect.gen(function* () {
	const recordingDevices = yield* enumerateRecordingDevices;
	for (const device of recordingDevices) {
		const maybeStream = yield* getStreamForDeviceId(device.deviceId);
		if (Option.isSome(maybeStream)) {
			settings.value.selectedAudioInputDeviceId = device.deviceId;
			mediaStreamManager.refreshStream().pipe(Effect.runPromise);
			return maybeStream.value;
		}
	}
	return yield* new WhisperingError({
		title: 'No available audio input devices',
		description: 'Please make sure you have a microphone connected',
		action: {
			type: 'link',
			label: 'Open Settings',
			goto: '/settings',
		},
	});
});
