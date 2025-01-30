import { useCreateRecording } from '$lib/query/recordings/mutations';
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
import { getContext, setContext } from 'svelte';
import { queryClient } from '..';
import {
	useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste,
	useTransformTranscribedTextFromRecordingWithSoundWithCopyPaste,
} from '../transcriber/transcriber';
import { recorderKeys, useRecorderState } from './queries';

const invalidateRecorderState = () =>
	queryClient.invalidateQueries({
		queryKey: recorderKeys.state,
	});

export type Recorder = ReturnType<typeof createRecorder>;

export const initRecorderInContext = () => {
	const recorder = createRecorder();
	setContext('recorder', recorder);
	return recorder;
};

export const getRecorderFromContext = () => {
	return getContext<Recorder>('recorder');
};

function createRecorder() {
	const recorderState = useRecorderState();
	const startRecordingWithToast = useStartRecordingWithToast();
	const stopRecordingWithToast = useStopRecordingWithToast();
	const ensureRecordingSessionClosedSilent =
		useEnsureRecordingSessionClosedSilent();
	const ensureRecordingSessionClosedWithToast =
		useEnsureRecordingSessionClosedWithToast();
	const cancelRecorderWithToast = useCancelRecorderWithToast();

	const createRecording = useCreateRecording();
	const transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste =
		useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste();
	const transformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste =
		useTransformTranscribedTextFromRecordingWithSoundWithCopyPaste();

	return {
		get recorderState() {
			return recorderState.data;
		},
		toggleRecordingWithToast: () => {
			const toastId = nanoid();
			if (recorderState.data === 'SESSION+RECORDING') {
				stopRecordingWithToast.mutate(
					{ toastId },
					{
						onSuccess: async (blob) => {
							console.info('Recording stopped');
							void playSoundIfEnabled('stop');

							const now = new Date().toISOString();
							const newRecordingId = nanoid();

							createRecording.mutate(
								{
									id: newRecordingId,
									title: '',
									subtitle: '',
									createdAt: now,
									updatedAt: now,
									timestamp: now,
									transcribedText: '',
									blob,
									transcriptionStatus: 'UNPROCESSED',
								},
								{
									onError(error, variables, context) {
										toast.error({
											id: toastId,
											title: '❌ Database Save Failed',
											description:
												'Your recording was captured but could not be saved to the database. Please check your storage space and permissions.',
											action: {
												type: 'more-details',
												error: error,
											},
										});
									},
									onSuccess: (createdRecording) => {
										toast.loading({
											id: toastId,
											title: '✨ Recording Complete!',
											description: settings.value[
												'recording.isFasterRerecordEnabled'
											]
												? 'Recording saved! Ready for another take'
												: 'Recording saved and session closed successfully',
										});

										const transcribeAndTransformToastId = nanoid();
										transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste.mutate(
											{
												recording: createdRecording,
												toastId: transcribeAndTransformToastId,
											},
											{
												onSuccess: async (transcribedText) => {
													if (
														settings.value[
															'transformations.selectedTransformationId'
														]
													) {
														transformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste.mutate(
															{
																transcribedText,
																recordingId: createdRecording.id,
																selectedTransformationId:
																	settings.value[
																		'transformations.selectedTransformationId'
																	],
																toastId: transcribeAndTransformToastId,
															},
														);
													}
												},
											},
										);

										if (!settings.value['recording.isFasterRerecordEnabled']) {
											toast.loading({
												id: toastId,
												title: '⏳ Closing recording session...',
												description: 'Wrapping things up, just a moment...',
											});
											ensureRecordingSessionClosedWithToast.mutate(
												{
													sendStatus: (options) =>
														toast.loading({ id: toastId, ...options }),
												},
												{
													onSuccess: async () => {
														toast.success({
															id: toastId,
															title: '✨ Session Closed Successfully',
															description:
																'Your recording session has been neatly wrapped up',
														});
													},
													onError: (error) => {
														toast.warning({
															id: toastId,
															title:
																'⚠️ Unable to close session after recording',
															description:
																'You might need to restart the application to continue recording',
															action: {
																type: 'more-details',
																error: error,
															},
														});
													},
												},
											);
										}
									},
								},
							);
						},
					},
				);
			} else {
				startRecordingWithToast.mutate(toastId);
			}
		},
		cancelRecorderWithToast: cancelRecorderWithToast.mutate,
		ensureRecordingSessionClosedSilent:
			ensureRecordingSessionClosedSilent.mutate,
		ensureRecordingSessionClosedWithToast:
			ensureRecordingSessionClosedWithToast.mutate,
	};
}

function useCancelRecorderWithToast() {
	const toastId = nanoid();
	const ensureRecordingSessionClosedWithToast =
		useEnsureRecordingSessionClosedWithToast();
	return createResultMutation(() => ({
		onMutate: () => {
			toast.loading({
				id: toastId,
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
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
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
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
								title: '❌ Failed to close session while cancelling recording',
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
	}));
}

function useStartRecordingWithToast() {
	const ensureRecordingSession = useEnsureRecordingSession();
	return createResultMutation(() => ({
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
	}));
}

function useEnsureRecordingSession() {
	return createResultMutation(() => ({
		mutationFn: async (toastId: string) => {
			const ensureRecordingSessionResult =
				await userConfiguredServices.recorder.ensureRecordingSession(
					{
						deviceId: settings.value['recording.selectedAudioInputDeviceId'],
						bitsPerSecond:
							Number(settings.value['recording.bitrateKbps']) * 1000,
					},
					{
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					},
				);
			return ensureRecordingSessionResult;
		},
		onError: (error, toastId) => {
			toast.error({ id: toastId, ...error });
		},
		onSettled: invalidateRecorderState,
	}));
}

function useStopRecordingWithToast() {
	return createResultMutation(() => ({
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
	}));
}

function useEnsureRecordingSessionClosedSilent() {
	return createResultMutation(() => ({
		mutationFn: async () => {
			const closeResult =
				await userConfiguredServices.recorder.ensureRecordingSessionClosed({
					sendStatus: noop,
				});
			return closeResult;
		},
		onSettled: invalidateRecorderState,
	}));
}

function useEnsureRecordingSessionClosedWithToast() {
	return createResultMutation(() => ({
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
	}));
}
