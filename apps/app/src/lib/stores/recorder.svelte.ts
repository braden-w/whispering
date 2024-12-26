import { WhisperingRecorderService } from '$lib/services/recorder';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import {
	recordings,
	RecordingsService,
	type Recording,
} from '$lib/services/db';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { settings } from '$lib/stores/settings.svelte';
import { Err, Ok, createMutation } from '@epicenterhq/result';
import {
	WhisperingErr,
	type ToastAndNotifyOptions,
	type WhisperingRecordingState,
	type WhisperingResult,
	type WhisperingSoundNames,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { transcriptionManager } from '$lib/transcribe.svelte';
import { extension } from '@repo/extension';
import { createTranscriptionServiceGroqLive } from '$lib/services/transcription/TranscriptionServiceGroqLive';
import { createTranscriptionServiceWhisperLive } from '$lib/services/transcription/TranscriptionServiceWhisperLive';
import { createTranscriptionServiceFasterWhisperServerLive } from '$lib/services/transcription/TranscriptionServiceFasterWhisperServerLive';
import { HttpService } from '$lib/services/http/HttpService';

const TranscriptionServiceWhisperLive = createTranscriptionServiceWhisperLive({
	HttpService,
});

const TranscriptionServiceGroqLive = createTranscriptionServiceGroqLive({
	HttpService,
});

const TranscriptionServiceFasterWhisperServerLive =
	createTranscriptionServiceFasterWhisperServerLive({
		HttpService,
	});

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

/**
 * Creates a set of toast functions that are scoped to a single mutation.
 * This is useful for creating multiple toasts in a single mutation.
 */
const createLocalToastFns = () => {
	const toastId = nanoid();
	return {
		success: (
			options: Pick<
				ToastAndNotifyOptions,
				'title' | 'description' | 'descriptionClass'
			>,
		) => {
			console.log('🚀 ~ createLocalToastFns ~ success:', options);
			return toast.success({ id: toastId, ...options });
		},
		error: (
			options: Pick<
				ToastAndNotifyOptions,
				'title' | 'description' | 'descriptionClass'
			>,
		) => {
			console.log('🚀 ~ createLocalToastFns ~ error:', options);
			return toast.error({ id: toastId, ...options });
		},
		loading: (
			options: Pick<
				ToastAndNotifyOptions,
				'title' | 'description' | 'descriptionClass'
			>,
		) => {
			console.log('🚀 ~ createLocalToastFns ~ loading:', options);
			return toast.loading({ id: toastId, ...options });
		},
	};
};

function createRecorder() {
	let recorderState = $state<WhisperingRecordingState>('IDLE');
	const transcribingRecordingIds = $state(new Set<string>());

	const isInRecordingSession = $derived(
		recorderState === 'SESSION+RECORDING' || recorderState === 'SESSION',
	);

	const setRecorderState = (newValue: WhisperingRecordingState) => {
		recorderState = newValue;
		const updateTrayIcon = async () => {
			const result = await SetTrayIconService.setTrayIcon(newValue);
			if (!result.ok) {
				renderErrAsToast({
					variant: 'warning',
					title: `Could not set tray icon to ${recorderState} icon...`,
					description: 'Please check your system tray settings',
					action: { type: 'more-details', error: result.error },
				});
			}
		};
		void updateTrayIcon();
	};

	// const stopRecording: () => Blob
	// play sound
	// notify
	// close session
	// transcribe recording // update db // cancel session if needed
	// copy to clipboard if needed
	// paste to cursor if needed

	const stopRecordingAndTranscribeAndCopyToClipboardAndPasteToCursorWithToast =
		async () => {
			const stopRecordingToastId = nanoid();
			toast.loading({
				id: stopRecordingToastId,
				title: '⏸️ Stopping recording...',
				description: 'Finalizing your audio capture...',
			});

			const stopResult = await WhisperingRecorderService.stopRecording(
				undefined,
				{
					sendStatus: (options) =>
						toast.loading({ id: stopRecordingToastId, ...options }),
				},
			);

			if (!stopResult.ok) {
				toast.error({
					id: stopRecordingToastId,
					title: '❌ Failed to Stop Recording',
					description: 'We encountered an issue while stopping your recording',
					action: { type: 'more-details', error: stopResult.error },
				});
				return;
			}
			setRecorderState('SESSION');
			console.info('Recording stopped');
			void playSound('stop');

			const blob = stopResult.data;
			const newRecording: Recording = {
				id: nanoid(),
				title: '',
				subtitle: '',
				timestamp: new Date().toISOString(),
				transcribedText: '',
				blob,
				transcriptionStatus: 'UNPROCESSED',
			};

			const saveRecordingToDatabaseResult =
				await RecordingsService.addRecording(newRecording);
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

			// transcribeAndCopyAndPaste, closeSessionIfNeeded

			const [
				_transcribeAndCopyAndPasteWithToastResult,
				_closeSessionWithToastResult,
			] = await Promise.all([
				(async () => {
					const selectedTranscriptionService = {
						OpenAI: TranscriptionServiceWhisperLive,
						Groq: TranscriptionServiceGroqLive,
						'faster-whisper-server':
							TranscriptionServiceFasterWhisperServerLive,
					}[settings.value.selectedTranscriptionService];

					const setStatusTranscribingResult =
						await RecordingsService.updateRecording({
							...newRecording,
							transcriptionStatus: 'TRANSCRIBING',
						});
					if (!setStatusTranscribingResult.ok) {
						toast.warning({
							title:
								'Unable to set recording transcription status to transcribing',
							description: 'Continuing with the transcription process...',
							action: {
								type: 'more-details',
								error: setStatusTranscribingResult.error,
							},
						});
					}

					transcribingRecordingIds.add(newRecording.id);
					const transcribeResult =
						await selectedTranscriptionService.transcribe(newRecording.blob);
					transcribingRecordingIds.delete(newRecording.id);
					if (!transcribeResult.ok) {
						toast.error({
							id: stopRecordingToastId,
							title: '❌ Failed to transcribe recording',
							description:
								'This is likely due to a temporary issue with the transcription service. Please try again later.',
							action: { type: 'more-details', error: transcribeResult.error },
						});
						return;
					}
					const transcribedText = transcribeResult.data;

					const updatedRecording = {
						...newRecording,
						transcribedText,
						transcriptionStatus: 'DONE',
					} satisfies Recording;
					const saveRecordingToDatabaseResult =
						await RecordingsService.updateRecording(updatedRecording);
					if (!saveRecordingToDatabaseResult.ok) {
						toast.error({
							id: stopRecordingToastId,
							title: 'Unable to update recording after transcription',
							description:
								"Transcription completed but unable to update recording's transcribed text and status in database",
							action: {
								type: 'more-details',
								error: saveRecordingToDatabaseResult.error,
							},
						});
					}
				})(),
				(async () => {
					toast.loading({
						id: stopRecordingToastId,
						title: '⏳ Closing recording session...',
						description: 'Wrapping things up, just a moment...',
					});
					const closeSessionResult =
						await WhisperingRecorderService.closeRecordingSession(undefined, {
							sendStatus: (options) =>
								toast.loading({ id: stopRecordingToastId, ...options }),
						});
					if (!closeSessionResult.ok) {
						toast.warning({
							id: stopRecordingToastId,
							title: 'Unable to close session after recording',
							description:
								'You might need to restart the application to continue recording',
							action: { type: 'more-details', error: closeSessionResult.error },
						});
						return;
					}
				})(),
			]);
		};

	return {
		get recorderState() {
			return recorderState;
		},

		get isInRecordingSession() {
			return isInRecordingSession;
		},

		closeRecordingSessionWithToast: async () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '⏳ Closing recording session...',
				description: 'Wrapping things up, just a moment...',
			});
			const closeResult = await WhisperingRecorderService.closeRecordingSession(
				undefined,
				{ sendStatus: (options) => toast.loading({ id: toastId, ...options }) },
			);
			if (!closeResult.ok) {
				toast.error({ id: toastId, ...closeResult.error });
				return;
			}
			setRecorderState('IDLE');
			toast.success({
				id: toastId,
				title: '✨ Session Closed Successfully',
				description: 'Your recording session has been neatly wrapped up',
			});
		},

		toggleRecordingWithToast: async () => {
			if (isInRecordingSession) {
				if (!transcribeRecordingAndUpdateDbResult.ok) {
					toast.error({
						id: stopRecordingToastId,
						title: '❌ Failed to Transcribe Recording',
						description:
							'Your recording was completed but could not be transcribed. This might be due to a temporary issue with the transcription service.',
						action: {
							type: 'more-details',
							error: transcribeRecordingAndUpdateDbResult.error,
						},
					});
					return;
				}

				const updatedRecording = transcribeRecordingAndUpdateDbResult.data;

				if (!settings.value.isCopyToClipboardEnabled) {
					toast.success({
						id: stopRecordingToastId,
						title: 'Recording transcribed!',
						description: updatedRecording.transcribedText,
						descriptionClass: 'line-clamp-2',
					});
				}

				if (settings.value.isFasterRerecordEnabled) {
				} else {
					toast.loading({
						id: stopRecordingToastId,
						title: '⏳ Closing session...',
						description: 'Wrapping up your recording session...',
					});
					const closeSessionResult =
						await WhisperingRecorderService.closeRecordingSession(undefined, {
							sendStatus: (options) =>
								toast.loading({ id: stopRecordingToastId, ...options }),
						});
					if (!closeSessionResult.ok) {
						return WhisperingErr({
							title: '❌ Failed to Close Session After Recording',
							description:
								'Your recording was saved but we encountered an issue while closing the session. You may need to restart the application.',
							action: {
								type: 'more-details',
								error: closeSessionResult.error,
							},
						});
					}
					setRecorderState('IDLE');
				}

				if (settings.value.isCopyToClipboardEnabled) {
					toast.loading({
						id: stopRecordingToastId,
						title: '⏳ Copying to clipboard...',
						description: 'Copying the transcription to your clipboard...',
					});
					const copyResult = await ClipboardService.setClipboardText(
						updatedRecording.transcribedText,
					);
					if (!copyResult.ok) {
						toast.success({
							id: stopRecordingToastId,
							title: 'Recording transcribed!',
							description: updatedRecording.transcribedText,
							descriptionClass: 'line-clamp-2',
						});
						if (copyResult.error._tag === 'WhisperingError') {
							return Err(copyResult.error);
						}
						return WhisperingErr({
							title: '❌ Failed to Copy to Clipboard',
							description:
								'We encountered an issue while copying the transcription to your clipboard. Please try again.',
							action: {
								type: 'more-details',
								error: copyResult.error,
							},
						});
					}
				}

				if (settings.value.isPasteContentsOnSuccessEnabled) {
					toast.loading({
						id: stopRecordingToastId,
						title: '⏳ Pasting ...',
						description: 'Pasting the transcription to your cursor...',
					});
					const pasteResult = await ClipboardService.writeTextToCursor(
						updatedRecording.transcribedText,
					);
					if (!pasteResult.ok) {
						toast.success({
							id: stopRecordingToastId,
							title: 'Recording transcribed and copied to clipboard!',
							description: updatedRecording.transcribedText,
							descriptionClass: 'line-clamp-2',
						});
						if (pasteResult.error._tag === 'WhisperingError') {
							return Err(pasteResult.error);
						}
						return WhisperingErr({
							title: '❌ Failed to Paste to Cursor',
							description:
								'We encountered an issue while pasting the transcription to your cursor. Please try again.',
							action: {
								type: 'more-details',
								error: pasteResult.error,
							},
						});
					}
				}
				toast.success({
					id: stopRecordingToastId,
					title: 'Recording transcribed, copied to clipboard, and pasted!',
					description: updatedRecording.transcribedText,
					descriptionClass: 'line-clamp-2',
				});
				return Ok(undefined);

				localToast.success({
					title: '✨ Recording Complete!',
					description: settings.value.isFasterRerecordEnabled
						? 'Recording saved! Ready for another take'
						: 'Recording saved and session closed successfully',
				});
			} else {
				const startRecordingWithToast = createMutation({
					onMutate: () => {
						const localToast = createLocalToastFns();
						localToast.loading({
							title: '🎙️ Preparing to record...',
							description: 'Setting up your recording environment...',
						});
						return Ok({ localToast });
					},
					mutationFn: async (_, { context: { localToast } }) => {
						if (!isInRecordingSession) {
							const initResult =
								await WhisperingRecorderService.initRecordingSession(
									{
										deviceId: settings.value.selectedAudioInputDeviceId,
										bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
									},
									{ sendStatus: localToast.loading },
								);
							if (!initResult.ok) {
								return WhisperingErr({
									title: '❌ Failed to Initialize Recording Session',
									description:
										'Could not start a new recording session. This might be due to microphone permissions or device connectivity issues. Please check your audio settings and try again.',
									action: { type: 'more-details', error: initResult.error },
								});
							}
						}
						const result = await WhisperingRecorderService.startRecording(
							nanoid(),
							{
								sendStatus: localToast.loading,
							},
						);
						if (!result.ok) {
							return WhisperingErr({
								title: '❌ Failed to Start Recording',
								description:
									'Unable to begin recording audio. Please check if your microphone is properly connected and permissions are granted.',
								action: { type: 'more-details', error: result.error },
							});
						}
						return Ok(undefined);
					},
					onSuccess: (_, { context: { localToast } }) => {
						setRecorderState('SESSION+RECORDING');
						localToast.success({
							title: '🎯 Recording Started!',
							description: 'Your voice is being captured crystal clear',
						});
						console.info('Recording started');
						void playSound('start');
						void NotificationService.notify({
							variant: 'info',
							id: IS_RECORDING_NOTIFICATION_ID,
							title: '🎙️ Whispering is recording...',
							description: 'Click to go to recorder',
							action: {
								type: 'link',
								label: 'Go to recorder',
								goto: '/',
							},
						});
					},
					onError: (error, { contextResult }) => {
						if (!contextResult.ok) {
							toast.error(contextResult.error);
							return;
						}
						const { localToast } = contextResult.data;
						localToast.error(error);
					},
				});
				startRecordingWithToast(undefined);
			}
		},

		cancelRecordingWithToast: async () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
			});
			const cancelResult = await WhisperingRecorderService.cancelRecording(
				undefined,
				{
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				},
			);
			if (!cancelResult.ok) {
				toast.error({
					id: toastId,
					title: '❌ Failed to Cancel Recording',
					description:
						'Unable to cancel the current recording. The recording may still be in progress. Try stopping it instead.',
					action: { type: 'more-details', error: cancelResult.error },
				});
				return;
			}
			setRecorderState('SESSION');
			if (settings.value.isFasterRerecordEnabled) {
				toast.success({
					title: '🚫 Recording Cancelled',
					description:
						'Recording discarded, but session remains open for a new take',
				});
			} else {
				toast.loading({
					id: toastId,
					title: '⏳ Closing session...',
					description: 'Wrapping up your recording session...',
				});
				const closeSessionResult =
					await WhisperingRecorderService.closeRecordingSession(undefined, {
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
					});
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
			}
			void playSound('cancel');
			setRecorderState('IDLE');
			console.info('Recording cancelled');
		},
	};
}

async function playSound(
	sound: WhisperingSoundNames,
): Promise<WhisperingResult<void>> {
	if (!settings.value.isPlaySoundEnabled) return Ok(undefined);

	if (!document.hidden) {
		switch (sound) {
			case 'start':
				await startSound.play();
				break;
			case 'stop':
				await stopSound.play();
				break;
			case 'cancel':
				await cancelSound.play();
				break;
		}
		return Ok(undefined);
	}

	const sendMessageToExtensionResult = await extension.playSound({ sound });

	if (!sendMessageToExtensionResult.ok)
		return WhisperingErr({
			title: '❌ Failed to Play Sound',
			description: `We encountered an issue while playing the ${sound} sound`,
			action: {
				type: 'more-details',
				error: sendMessageToExtensionResult.error,
			},
		});
	return Ok(undefined);
}
