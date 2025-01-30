import { useCreateRecording } from '$lib/query/recordings/mutations';
import { playSoundIfEnabled } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { nanoid } from 'nanoid/non-secure';
import { getContext, setContext } from 'svelte';
import {
	useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste,
	useTransformTranscribedTextFromRecordingWithSoundWithCopyPaste,
} from '../transcriber/transcriber';
import {
	useCancelRecorderWithToast,
	useEnsureRecordingSessionClosedSilent,
	useEnsureRecordingSessionClosedWithToast,
	useStartRecordingWithToast,
	useStopRecordingWithToast,
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
	const { startRecordingWithToast } = useStartRecordingWithToast();
	const { stopRecordingWithToast } = useStopRecordingWithToast();
	const { ensureRecordingSessionClosedSilent } =
		useEnsureRecordingSessionClosedSilent();
	const { ensureRecordingSessionClosedWithToast } =
		useEnsureRecordingSessionClosedWithToast();
	const { cancelRecorderWithToast } = useCancelRecorderWithToast();

	const { createRecording } = useCreateRecording();
	const { transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste } =
		useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste();
	const { transformTranscribedTextFromRecordingWithSoundWithCopyPaste } =
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
														transformTranscribedTextFromRecordingWithSoundWithCopyPaste.mutate(
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
