import { createResultMutation } from '$lib/services';
import {
	playSoundIfEnabled,
	userConfiguredServices,
} from '$lib/services/index.js';
import type { UpdateStatusMessageFn } from '$lib/services/recorder/RecorderService';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { noop } from '@tanstack/table-core';
import { nanoid } from 'nanoid/non-secure';
import { queryClient } from '..';
import { recorderKeys } from './queries';

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({ queryKey: recorderKeys.state });

export function useCancelRecorder() {
	return {
		cancelRecorder: createResultMutation(() => ({
			mutationFn: async ({ toastId }: { toastId: string }) => {
				const cancelResult =
					await userConfiguredServices.recorder.cancelRecording({
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					});
				return cancelResult;
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useStartRecording() {
	return {
		startRecording: createResultMutation(() => ({
			mutationFn: async (toastId: string) => {
				const startRecordingResult =
					await userConfiguredServices.recorder.startRecording(nanoid(), {
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					});
				return startRecordingResult;
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useEnsureRecordingSession() {
	return {
		ensureRecordingSession: createResultMutation(() => ({
			mutationFn: async (toastId: string) => {
				const ensureRecordingSessionResult =
					await userConfiguredServices.recorder.ensureRecordingSession(
						{
							deviceId: settings.value['recording.selectedAudioInputDeviceId'],
							bitsPerSecond:
								Number(settings.value['recording.bitrateKbps']) * 1000,
						},
						{
							sendStatus: (options) =>
								toast.loading({ id: toastId, ...options }),
						},
					);
				return ensureRecordingSessionResult;
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useStopRecording() {
	return {
		stopRecording: createResultMutation(() => ({
			mutationFn: async ({ toastId }: { toastId: string }) => {
				const stopResult = await userConfiguredServices.recorder.stopRecording({
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
				return stopResult;
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useEnsureRecordingSessionClosed() {
	return {
		ensureRecordingSessionClosed: createResultMutation(() => ({
			mutationFn: async ({
				sendStatus,
			}: { sendStatus: UpdateStatusMessageFn }) => {
				const closeResult =
					await userConfiguredServices.recorder.ensureRecordingSessionClosed({
						sendStatus,
					});
				return closeResult;
			},
			onSettled: invalidateRecorderState,
		})),
	};
}
