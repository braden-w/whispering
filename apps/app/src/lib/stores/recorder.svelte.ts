import {
	ClipboardService,
	DbService,
	SetTrayIconService,
	userConfiguredServices,
} from '$lib/services.svelte';
import type { Recording } from '$lib/services/db';
import { transcriber } from '$lib/stores/transcriber.svelte';
import { settings } from '$lib/stores/settings.svelte';
import { clipboard } from '$lib/utils/clipboard';
import { toast } from '$lib/utils/toast';
import {
	WHISPERING_RECORDINGS_PATHNAME,
	type WhisperingRecordingState,
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
			void userConfiguredServices.sound.playStopSoundIfEnabled();

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
				await DbService.createRecording(newRecording);
			if (!saveRecordingToDatabaseResult.ok) {
				toast.error({
					id: stopRecordingToastId,
					title: '❌ Failed to save recording to database',
					description: 'Recording completed but unable to save to database',
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

					if (settings.value['transcription.clipboard.copyOnSuccess']) {
						toast.loading({
							id: stopRecordingToastId,
							title: '⏳ Copying to clipboard...',
							description: 'Copying the transcription to your clipboard...',
						});
						const copyResult =
							await ClipboardService.setClipboardText(transcribedText);
						if (!copyResult.ok) {
							toast.warning(copyResult.error);
							toast.success({
								id: stopRecordingToastId,
								title: '📝 Recording transcribed!',
								description:
									"We couldn't copy the transcription to your clipboard, though. You can copy it manually.",
								descriptionClass: 'line-clamp-2',
								action: {
									type: 'button',
									label: 'Copy to clipboard',
									onClick: () =>
										clipboard.copyTextToClipboardWithToast({
											label: 'transcribed text',
											text: transcribedText,
										}),
								},
							});
							return;
						}
					}

					if (!settings.value['transcription.clipboard.pasteOnSuccess']) {
						toast.success({
							id: stopRecordingToastId,
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
						id: stopRecordingToastId,
						title: '⏳ Pasting ...',
						description: 'Pasting the transcription to your cursor...',
					});
					const pasteResult =
						await ClipboardService.writeTextToCursor(transcribedText);
					if (!pasteResult.ok) {
						toast.warning(pasteResult.error);
						toast.success({
							id: stopRecordingToastId,
							title: '📝📋 Recording transcribed and copied to clipboard!',
							description: transcribedText,
							descriptionClass: 'line-clamp-2',
						});
						return;
					}
					toast.success({
						id: stopRecordingToastId,
						title:
							'📝📋✍️ Recording transcribed, copied to clipboard, and pasted!',
						description: transcribedText,
						descriptionClass: 'line-clamp-2',
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
		void userConfiguredServices.sound.playStartSoundIfEnabled();
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
			void userConfiguredServices.sound.playCancelSoundIfEnabled();
			console.info('Recording cancelled');
		},
	};
}
