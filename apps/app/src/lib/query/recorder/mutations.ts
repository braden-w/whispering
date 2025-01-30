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
	queryClient.invalidateQueries({
		queryKey: recorderKeys.state,
	});

export function useCancelRecorderWithToast() {
	const toastId = nanoid();
	const { ensureRecordingSessionClosedWithToast } =
		useEnsureRecordingSessionClosedWithToast();
	return {
		cancelRecorderWithToast: createResultMutation(() => ({
			onMutate: () => {
				toast.loading({
					id: toastId,
					title: '⏸️ Canceling recording...',
					description: 'Cleaning up recording session...',
				});
			},
			mutationFn: async () => {
				const cancelResult =
					await userConfiguredServices.recorder.cancelRecording({
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					});
				return cancelResult;
			},
			onSuccess: async (_data, _variables, ctx) => {
				if (settings.value['recording.isFasterRerecordEnabled']) {
					toast.success({
						id: toastId,
						title: '🚫 Recording Cancelled',
						description:
							'Recording discarded, but session remains open for a new take',
					});
				} else {
					ensureRecordingSessionClosedWithToast.mutate(
						{
							sendStatus: (options) =>
								toast.loading({ id: toastId, ...options }),
						},
						{
							onSuccess: () => {
								toast.success({
									id: toastId,
									title: '✅ All Done!',
									description:
										'Recording cancelled and session closed successfully',
								});
								void playSoundIfEnabled('cancel');
								console.info('Recording cancelled');
							},
							onError: (error) => {
								toast.error({
									id: toastId,
									title:
										'❌ Failed to close session while cancelling recording',
									description:
										'Your recording was cancelled but we encountered an issue while closing your session. You may need to restart the application.',
									action: { type: 'more-details', error: error },
								});
							},
						},
					);
				}
			},
			onError: (error) => {
				toast.error({ id: toastId, ...error });
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useStartRecordingWithToast() {
	const { ensureRecordingSession } = useEnsureRecordingSession();
	return {
		startRecordingWithToast: createResultMutation(() => ({
			onMutate: async (toastId) => {
				toast.loading({
					id: toastId,
					title: '🎙️ Preparing to record...',
					description: 'Setting up your recording environment...',
				});
				await ensureRecordingSession.mutateAsync(toastId);
			},
			mutationFn: async (toastId: string) => {
				const startRecordingResult =
					await userConfiguredServices.recorder.startRecording(nanoid(), {
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					});
				return startRecordingResult;
			},
			onSuccess: (_data, toastId) => {
				toast.success({
					id: toastId,
					title: '🎙️ Whispering is recording...',
					description: 'Speak now and stop recording when done',
				});
				console.info('Recording started');
				void playSoundIfEnabled('start');
			},
			onError: (error, toastId) => {
				toast.error({ id: toastId, ...error });
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

function useEnsureRecordingSession() {
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
			onError: (error, toastId) => {
				toast.error({ id: toastId, ...error });
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useStopRecordingWithToast() {
	return {
		stopRecordingWithToast: createResultMutation(() => ({
			onMutate: ({ toastId }) => {
				toast.loading({
					id: toastId,
					title: '⏸️ Stopping recording...',
					description: 'Finalizing your audio capture...',
				});
			},
			mutationFn: async ({ toastId }: { toastId: string }) => {
				const stopResult = await userConfiguredServices.recorder.stopRecording({
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
				return stopResult;
			},
			onError: (error, { toastId }) => {
				toast.error({ id: toastId, ...error });
			},
			onSuccess: async (_blob, { toastId }) => {
				toast.success({
					id: toastId,
					title: '🎙️ Recording stopped',
					description: 'Your recording has been saved',
				});
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useEnsureRecordingSessionClosedSilent() {
	return {
		ensureRecordingSessionClosedSilent: createResultMutation(() => ({
			mutationFn: async () => {
				const closeResult =
					await userConfiguredServices.recorder.ensureRecordingSessionClosed({
						sendStatus: noop,
					});
				return closeResult;
			},
			onSettled: invalidateRecorderState,
		})),
	};
}

export function useEnsureRecordingSessionClosedWithToast() {
	return {
		ensureRecordingSessionClosedWithToast: createResultMutation(() => ({
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
