import { useCreateRecording } from '$lib/query/recordings/mutations';
import { playSoundIfEnabled } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import {
	useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste,
	useTransformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste,
} from '../transcriber/transcriber';
import {
	useCancelRecorder,
	useEnsureRecordingSession,
	useEnsureRecordingSessionClosed,
	useStartRecording,
	useStopRecording,
} from './mutations';
import { useRecorderState } from './queries';

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
	const { recorderState } = useRecorderState();
	const { startRecording } = useStartRecording();
	const { stopRecording } = useStopRecording();
	const {
		ensureRecordingSessionClosedSilent,
		ensureRecordingSessionClosedWithToast,
	} = useEnsureRecordingSessionClosed();
	const { cancelRecorder } = useCancelRecorder();
	const { ensureRecordingSession } = useEnsureRecordingSession();

	const { createRecording } = useCreateRecording();
	const { transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste } =
		useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste();
	const {
		transformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste,
	} = useTransformTranscribedTextFromRecordingWithToastWithSoundWithCopyPaste();

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
				},
			);
		},
		ensureRecordingSessionClosedSilent:
			ensureRecordingSessionClosedSilent.mutate,
		ensureRecordingSessionClosedWithToast:
			ensureRecordingSessionClosedWithToast.mutate,
	};
}
