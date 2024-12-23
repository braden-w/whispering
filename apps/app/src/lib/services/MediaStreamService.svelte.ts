import { settings } from '$lib/stores/settings.svelte.js';
import {
	Ok,
	WhisperingErr,
	type WhisperingResult,
	tryAsyncBubble,
	tryAsyncWhispering,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { toast } from './ToastService.js';

export const mediaStream = createMediaStreamManager();

function createMediaStreamManager() {
	let currentStream: MediaStream | null = null;
	let isStreamValid = $state<boolean>(false);
	const setStream = (stream: MediaStream | null) => {
		currentStream = stream;
		isStreamValid = stream?.active ?? false;
	};

	return {
		get stream() {
			return currentStream;
		},
		get isStreamValid() {
			return isStreamValid;
		},
		async refreshStream(): Promise<WhisperingResult<MediaStream>> {
			this.destroy();
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: 'Connecting to selected audio input device...',
				description: 'Please allow access to your microphone if prompted.',
			});
			if (!settings.value.selectedAudioInputDeviceId) {
				toast.loading({
					id: toastId,
					title: 'No device selected',
					description: 'Defaulting to first available audio input device...',
				});
				const firstAvailableStreamResult = await getFirstAvailableStream();
				if (!firstAvailableStreamResult.ok) return firstAvailableStreamResult;
				const firstAvailableStream = firstAvailableStreamResult.data;
				setStream(firstAvailableStream);
				toast.info({
					id: toastId,
					title: 'Defaulted to first available audio input device',
					description: 'You can select a specific device in the settings.',
				});
				return Ok(firstAvailableStream);
			}
			const maybeStream = await getStreamForDeviceId(
				settings.value.selectedAudioInputDeviceId,
			);
			if (maybeStream !== null) {
				setStream(maybeStream);
				toast.success({
					id: toastId,
					title: 'Connected to selected audio input device',
					description: 'Successfully connected to your microphone stream.',
				});
				return Ok(maybeStream);
			}
			toast.loading({
				id: toastId,
				title: 'Error connecting to selected audio input device',
				description: 'Trying to find another available audio input device...',
			});
			const firstAvailableStreamResult = await getFirstAvailableStream();
			if (!firstAvailableStreamResult.ok) {
				toast.dismiss(toastId);
				return firstAvailableStreamResult;
			}
			const firstAvailableStream = firstAvailableStreamResult.data;
			setStream(firstAvailableStream);
			toast.info({
				id: toastId,
				title: 'Defaulted to first available audio input device',
				description: 'You can select a specific device in the settings.',
			});
			return Ok(firstAvailableStream);
		},
		destroy() {
			if (currentStream === null) return;
			for (const track of currentStream.getTracks()) {
				track.stop();
			}
			setStream(null);
		},
	} as const;
}

export function enumerateRecordingDevices(): Promise<
	WhisperingResult<MediaDeviceInfo[]>
> {
	return tryAsyncWhispering({
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
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Error enumerating recording devices',
			description:
				'Please make sure you have given permission to access your audio devices',
			action: {
				type: 'more-details',
				error,
			},
		}),
	});
}

async function getFirstAvailableStream(): Promise<
	WhisperingResult<MediaStream>
> {
	const recordingDevicesResult = await enumerateRecordingDevices();
	if (!recordingDevicesResult.ok) return recordingDevicesResult;
	const recordingDevices = recordingDevicesResult.data;

	for (const device of recordingDevices) {
		const maybeStream = await getStreamForDeviceId(device.deviceId);
		if (maybeStream) {
			settings.value.selectedAudioInputDeviceId = device.deviceId;
			mediaStream.refreshStream();
			return Ok(maybeStream);
		}
	}
	return WhisperingErr({
		title: 'No available audio input devices',
		description: 'Please make sure you have a microphone connected',
		action: {
			type: 'link',
			label: 'Open Settings',
			goto: '/settings',
		},
	});
}

async function getStreamForDeviceId(
	recordingDeviceId: string,
): Promise<MediaStream | null> {
	const result = await tryAsyncBubble({
		try: async () => {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					deviceId: { exact: recordingDeviceId },
					channelCount: 1, // Mono audio is usually sufficient for voice recording
					sampleRate: 16000, // 16 kHz is a good balance for voice
				},
			});
			return stream;
		},
		catch: (error) => ({
			_tag: 'GetStreamError',
			message:
				error instanceof Error ? error.message : 'Please try again later.',
		}),
	});
	if (result.ok) return result.data;
	return null;
}
