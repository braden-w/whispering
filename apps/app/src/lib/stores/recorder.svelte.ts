import {
	copyTextToClipboard,
	copyTextToClipboardWithToast,
	writeTextToCursor,
} from '$lib/query/clipboard/mutations';
import { createRecording } from '$lib/query/recordings/mutations';
import type { Recording } from '$lib/services/db';
import {
	playSoundIfEnabled,
	SetTrayIconService,
	userConfiguredServices,
	DbTransformationsService,
	RunTransformationService,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import { transcriber } from '$lib/stores/transcriber.svelte';
import { Ok } from '@epicenterhq/result';
import {
	WHISPERING_RECORDINGS_PATHNAME,
	WhisperingErr,
	type WhisperingRecordingState,
	type WhisperingResult,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

export const recorder = createRecorder();

function createRecorder() {
	let recorderState = $state<WhisperingRecordingState>('IDLE');

	const setRecorderState = async (newValue: WhisperingRecordingState) => {
		recorderState = newValue;
		const _setTrayIconResult = await SetTrayIconService.setTrayIcon(newValue);
	};

	const stopRecordingAndTranscribeAndCopyToClipboardAndPasteToCursorWithToast =
		async () => {
			const stopRecordingToastId = nanoid();
			toast.loading({
				id: stopRecordingToastId,
				title: '⏸️ Stopping recording...',
				description: 'Finalizing your audio capture...',
			});

			const stopResult = await userConfiguredServices.recorder.stopRecording(
				undefined,
				{
					sendStatus: (options) =>
						toast.loading({ id: stopRecordingToastId, ...options }),
				},
			);

			if (!stopResult.ok) {
				toast.error({ id: stopRecordingToastId, ...stopResult.error });
				return;
			}
			await setRecorderState('SESSION');
			console.info('Recording stopped');
			void playSoundIfEnabled('stop');

			const blob = stopResult.data;
			const now = new Date().toISOString();
			const newRecording: Recording = {
				id: nanoid(),
				title: '',
				subtitle: '',
				createdAt: now,
				updatedAt: now,
				timestamp: now,
				transcribedText: '',
				blob,
				transcriptionStatus: 'UNPROCESSED',
			};

			const saveRecordingToDatabaseResult =
				await createRecording.mutateAsync(newRecording);
			if (!saveRecordingToDatabaseResult.ok) {
				toast.error({
					id: stopRecordingToastId,
					title: '❌ Database Save Failed',
					description:
						'Your recording was captured but could not be saved to the database. Please check your storage space and permissions.',
					action: {
						type: 'more-details',
						error: saveRecordingToDatabaseResult.error,
					},
				});
				return;
			}

			toast.loading({
				id: stopRecordingToastId,
				title: '✨ Recording Complete!',
				description: settings.value['recording.isFasterRerecordEnabled']
					? 'Recording saved! Ready for another take'
					: 'Recording saved and session closed successfully',
			});

			const [
				_transcribeAndCopyAndPasteWithToastResult,
				_closeSessionIfNeededWithToastResult,
			] = await Promise.all([
				(async () => {
					const transcribeAndUpdateWithToastResult =
						await transcriber.transcribeAndUpdateRecordingWithToast(
							newRecording,
							{ toastId: stopRecordingToastId },
						);
					if (!transcribeAndUpdateWithToastResult.ok) return;

					const { transcribedText } = transcribeAndUpdateWithToastResult.data;

					if (!settings.value['transformations.selectedTransformationId']) {
						await maybeCopyMaybePaste({
							transcribedText,
							toastId: stopRecordingToastId,
						});
						return;
					}
					toast.loading({
						id: stopRecordingToastId,
						title: '🔄 Running transformation...',
						description:
							'Applying your selected transformation to the transcribed text...',
					});

					// Process the transcribed text with any selected transformation
					const processResult = await processTranscribedText({
						transcribedText,
						recordingId: newRecording.id,
						selectedTransformationId:
							settings.value['transformations.selectedTransformationId'],
					});
					if (!processResult.ok) {
						toast.warning({
							id: stopRecordingToastId,
							...processResult.error,
						});
						maybeCopyMaybePaste({
							transcribedText,
							toastId: stopRecordingToastId,
						});
						return;
					}

					const finalText = processResult.data;

					void playSoundIfEnabled('transformationComplete');
					maybeCopyMaybePaste({
						transcribedText: finalText,
						toastId: stopRecordingToastId,
					});
				})(),
				(async () => {
					if (settings.value['recording.isFasterRerecordEnabled']) return;
					toast.loading({
						id: stopRecordingToastId,
						title: '⏳ Closing session...',
						description: 'Wrapping up your recording session...',
					});
					const closeSessionResult =
						await userConfiguredServices.recorder.closeRecordingSession(
							undefined,
							{
								sendStatus: (options) =>
									toast.loading({ id: stopRecordingToastId, ...options }),
							},
						);
					if (!closeSessionResult.ok) {
						toast.warning({
							id: stopRecordingToastId,
							title: '⚠️ Unable to close session after recording',
							description:
								'You might need to restart the application to continue recording',
							action: { type: 'more-details', error: closeSessionResult.error },
						});
						return;
					}
					await setRecorderState('IDLE');
				})(),
			]);
		};

	const startRecordingWithToast = async () => {
		const startRecordingToastId = nanoid();
		toast.loading({
			id: startRecordingToastId,
			title: '🎙️ Preparing to record...',
			description: 'Setting up your recording environment...',
		});
		if (recorderState === 'IDLE') {
			const initResult =
				await userConfiguredServices.recorder.initRecordingSession(
					{
						deviceId: settings.value['recording.selectedAudioInputDeviceId'],
						bitsPerSecond:
							Number(settings.value['recording.bitrateKbps']) * 1000,
					},
					{
						sendStatus: (options) =>
							toast.loading({ id: startRecordingToastId, ...options }),
					},
				);
			if (!initResult.ok) {
				toast.error({ id: startRecordingToastId, ...initResult.error });
				return;
			}
			await setRecorderState('SESSION');
		}
		const startRecordingResult =
			await userConfiguredServices.recorder.startRecording(nanoid(), {
				sendStatus: (options) =>
					toast.loading({ id: startRecordingToastId, ...options }),
			});
		if (!startRecordingResult.ok) {
			toast.error({ id: startRecordingToastId, ...startRecordingResult.error });
			return;
		}
		await setRecorderState('SESSION+RECORDING');
		toast.success({
			id: startRecordingToastId,
			title: '🎙️ Whispering is recording...',
			description: 'Speak now and stop recording when done',
		});
		console.info('Recording started');
		void playSoundIfEnabled('start');
	};

	return {
		get recorderState() {
			return recorderState;
		},

		closeRecordingSessionWithToast: async () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '⏳ Closing recording session...',
				description: 'Wrapping things up, just a moment...',
			});
			const closeResult =
				await userConfiguredServices.recorder.closeRecordingSession(undefined, {
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
			if (!closeResult.ok) {
				toast.error({ id: toastId, ...closeResult.error });
				return;
			}
			await setRecorderState('IDLE');
			toast.success({
				id: toastId,
				title: '✨ Session Closed Successfully',
				description: 'Your recording session has been neatly wrapped up',
			});
		},

		toggleRecordingWithToast: () => {
			if (recorderState === 'SESSION+RECORDING') {
				stopRecordingAndTranscribeAndCopyToClipboardAndPasteToCursorWithToast();
			} else {
				startRecordingWithToast();
			}
		},

		cancelRecordingWithToast: async () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
			});
			const cancelResult =
				await userConfiguredServices.recorder.cancelRecording(undefined, {
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
			if (!cancelResult.ok) {
				toast.error({ id: toastId, ...cancelResult.error });
				return;
			}
			await setRecorderState('SESSION');
			if (settings.value['recording.isFasterRerecordEnabled']) {
				toast.success({
					id: toastId,
					title: '🚫 Recording Cancelled',
					description:
						'Recording discarded, but session remains open for a new take',
				});
				await setRecorderState('SESSION');
			} else {
				toast.loading({
					id: toastId,
					title: '⏳ Closing session...',
					description: 'Wrapping up your recording session...',
				});
				const closeSessionResult =
					await userConfiguredServices.recorder.closeRecordingSession(
						undefined,
						{
							sendStatus: (options) =>
								toast.loading({ id: toastId, ...options }),
						},
					);
				if (!closeSessionResult.ok) {
					toast.error({
						id: toastId,
						title: '❌ Failed to close session while cancelling recording',
						description:
							'Your recording was cancelled but we encountered an issue while closing your session. You may need to restart the application.',
						action: { type: 'more-details', error: closeSessionResult.error },
					});
					return;
				}
				toast.success({
					id: toastId,
					title: '✅ All Done!',
					description: 'Recording cancelled and session closed successfully',
				});
				await setRecorderState('IDLE');
			}
			void playSoundIfEnabled('cancel');
			console.info('Recording cancelled');
		},
	};
}

async function processTranscribedText({
	transcribedText,
	recordingId,
	selectedTransformationId,
}: {
	transcribedText: string;
	recordingId: string;
	selectedTransformationId: string;
}): Promise<WhisperingResult<string>> {
	const getTransformationResult =
		await DbTransformationsService.getTransformationById(
			selectedTransformationId,
		);
	if (!getTransformationResult.ok) {
		return WhisperingErr({
			title: '⚠️ Transformation not found',
			description:
				'Could not find the selected transformation. Using original transcription.',
		});
	}

	const transformation = getTransformationResult.data;
	if (!transformation) {
		return WhisperingErr({
			title: '⚠️ Transformation not found',
			description:
				'Could not find the selected transformation. Using original transcription.',
		});
	}

	const transformationResult = await RunTransformationService.runTransformation(
		{
			recordingId,
			input: transcribedText,
			transformation,
		},
	);

	if (!transformationResult.ok) {
		return WhisperingErr({
			title: '⚠️ Transformation failed',
			description:
				'Failed to apply the transformation. Using original transcription.',
		});
	}

	const transformationRun = transformationResult.data;
	if (transformationRun.error) {
		return WhisperingErr({
			title: '⚠️ Transformation error',
			description: transformationRun.error,
		});
	}

	if (!transformationRun.output) {
		return WhisperingErr({
			title: '⚠️ Transformation produced no output',
			description:
				'The transformation completed but produced no output. Using original transcription.',
		});
	}

	return Ok(transformationRun.output);
}

async function maybeCopyMaybePaste({
	transcribedText,
	toastId,
}: {
	transcribedText: string;
	toastId: string;
}) {
	if (!settings.value['transcription.clipboard.copyOnSuccess']) {
		return;
	}

	toast.loading({
		id: toastId,
		title: '⏳ Copying to clipboard...',
		description: 'Copying the transcribed text to your clipboard...',
	});
	const copyResult = await copyTextToClipboard.mutateAsync(transcribedText);
	if (!copyResult.ok) {
		toast.warning({
			id: toastId,
			title: '⚠️ Clipboard Access Failed',
			description:
				'Could not copy text to clipboard. This may be due to browser restrictions or permissions. You can copy the text manually below.',
			action: { type: 'more-details', error: copyResult.error },
		});
		toast.success({
			title: '📝 Recording transcribed!',
			description: transcribedText,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'button',
				label: 'Copy to clipboard',
				onClick: () =>
					copyTextToClipboardWithToast.mutate({
						label: 'transcribed text',
						text: transcribedText,
					}),
			},
		});
	}

	if (!settings.value['transcription.clipboard.pasteOnSuccess']) {
		toast.success({
			id: toastId,
			title: '📝📋 Recording transcribed and copied to clipboard!',
			description: transcribedText,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: WHISPERING_RECORDINGS_PATHNAME,
			},
		});
		return;
	}
	toast.loading({
		id: toastId,
		title: '⏳ Pasting ...',
		description: 'Pasting the transcription to your cursor...',
	});
	const pasteResult = await writeTextToCursor.mutateAsync(transcribedText);
	if (!pasteResult.ok) {
		toast.warning({
			id: toastId,
			title: '⚠️ Paste Operation Failed',
			description:
				'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
			action: { type: 'more-details', error: pasteResult.error },
		});
		toast.success({
			title: '📝📋 Recording transcribed and copied to clipboard!',
			description: transcribedText,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'button',
				label: 'Copy again',
				onClick: () =>
					copyTextToClipboardWithToast.mutate({
						label: 'transcribed text',
						text: transcribedText,
					}),
			},
		});
		return;
	}
	toast.success({
		id: toastId,
		title: '📝📋✍️ Recording transcribed, copied to clipboard, and pasted!',
		description: transcribedText,
		descriptionClass: 'line-clamp-2',
		action: {
			type: 'link',
			label: 'Go to recordings',
			goto: WHISPERING_RECORDINGS_PATHNAME,
		},
	});
}
