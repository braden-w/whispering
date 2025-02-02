import { useCreateRecording } from '$lib/query/recordings/mutations';
import { playSoundIfEnabled } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import {
	useCancelRecorder,
	useEnsureRecordingSession,
	useEnsureRecordingSessionClosed,
	useStartRecording,
	useStopRecording,
} from './mutations';
import { useRecorderState } from './queries';
import { noop } from '@tanstack/table-core';
import type { Transcriber } from '../transcriber/transcriber';
import { useTransformRecording } from '../transformations/mutations';

export type Recorder = ReturnType<typeof createRecorder>;

export const initRecorderInContext = ({
	transcriber,
}: {
	transcriber: Transcriber;
}) => {
	const recorder = createRecorder({ transcriber });
	setContext('recorder', recorder);
	return recorder;
};

export const getRecorderFromContext = () => {
	return getContext<Recorder>('recorder');
};

function createRecorder({ transcriber }: { transcriber: Transcriber }) {
	const { recorderState } = useRecorderState();
	const { startRecording } = useStartRecording();
	const { stopRecording } = useStopRecording();
	const { ensureRecordingSessionClosed } = useEnsureRecordingSessionClosed();
	const { cancelRecorder } = useCancelRecorder();
	const { ensureRecordingSession } = useEnsureRecordingSession();
	const { createRecording } = useCreateRecording();
	const { transformAndUpdateRecordingWithToastWithSoundWithCopyPaste } =
		useTransformRecording();

	return {
		get recorderState() {
			return recorderState.data;
		},
		toggleRecordingWithToast: async () => {
			const toastId = nanoid();
			if (recorderState.data === 'SESSION+RECORDING') {
				toast.loading({
					id: toastId,
					title: '⏸️ Stopping recording...',
					description: 'Finalizing your audio capture...',
				});
				stopRecording.mutate(
					{ toastId },
					{
						onError: (error, { toastId }) => {
							toast.error({ id: toastId, ...error });
						},
						onSuccess: async (blob) => {
							toast.success({
								id: toastId,
								title: '🎙️ Recording stopped',
								description: 'Your recording has been saved',
							});
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
									onSuccess: async (createdRecording) => {
										toast.loading({
											id: toastId,
											title: '✨ Recording Complete!',
											description: settings.value[
												'recording.isFasterRerecordEnabled'
											]
												? 'Recording saved! Ready for another take'
												: 'Recording saved and session closed successfully',
										});

										if (!settings.value['recording.isFasterRerecordEnabled']) {
											toast.loading({
												id: toastId,
												title: '⏳ Closing recording session...',
												description: 'Wrapping things up, just a moment...',
											});
											ensureRecordingSessionClosed.mutate(
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

										await transcriber.transcribeRecording({
											recording: createdRecording,
											toastId,
										});
										if (
											settings.value['transformations.selectedTransformationId']
										) {
											await transformAndUpdateRecordingWithToastWithSoundWithCopyPaste(
												{
													recordingId: createdRecording.id,
													transformationId:
														settings.value[
															'transformations.selectedTransformationId'
														],
													toastId,
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
				toast.loading({
					id: toastId,
					title: '🎙️ Preparing to record...',
					description: 'Setting up your recording environment...',
				});
				ensureRecordingSession.mutate(toastId, {
					onError: (error, toastId) => {
						toast.error({ id: toastId, ...error });
					},
					onSuccess: (_data, toastId) => {
						startRecording.mutate(toastId, {
							onError: (error, toastId) => {
								toast.error({ id: toastId, ...error });
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
						});
					},
				});
			}
		},
		cancelRecorderWithToast: () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '⏸️ Canceling recording...',
				description: 'Cleaning up recording session...',
			});
			cancelRecorder.mutate(
				{ toastId },
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
					onSuccess: async () => {
						if (settings.value['recording.isFasterRerecordEnabled']) {
							toast.success({
								id: toastId,
								title: '🚫 Recording Cancelled',
								description:
									'Recording discarded, but session remains open for a new take',
							});
						} else {
							ensureRecordingSessionClosed.mutate(
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
				},
			);
		},
		ensureRecordingSessionClosedSilent: () => {
			const toastId = nanoid();
			ensureRecordingSessionClosed.mutate(
				{
					sendStatus: noop,
				},
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
				},
			);
		},
		ensureRecordingSessionClosedWithToast: () => {
			const toastId = nanoid();
			return ensureRecordingSessionClosed.mutate(
				{
					sendStatus: (status) => {
						toast.info({ id: toastId, ...status });
					},
				},
				{
					onError: (error) => {
						toast.error({ id: toastId, ...error });
					},
				},
			);
		},
	};
}
