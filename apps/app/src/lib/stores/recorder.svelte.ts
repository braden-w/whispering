import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { clipboard } from '$lib/services/clipboard';
import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import { type Recording, RecordingsService } from '$lib/services/db';
import { HttpService } from '$lib/services/http/HttpService';
import { RecorderService } from '$lib/services/recorder';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { createTranscriptionServiceFasterWhisperServerLive } from '$lib/services/transcription/TranscriptionServiceFasterWhisperServerLive';
import { createTranscriptionServiceGroqLive } from '$lib/services/transcription/TranscriptionServiceGroqLive';
import { createTranscriptionServiceWhisperLive } from '$lib/services/transcription/TranscriptionServiceWhisperLive';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import {
	WHISPERING_RECORDINGS_PATHNAME,
	WhisperingErr,
	type WhisperingRecordingState,
	type WhisperingResult,
	type WhisperingSoundNames,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

function createRecorder() {
	let recorderState = $state<WhisperingRecordingState>('IDLE');
	const transcribingRecordingIds = $state(new Set<string>());

	const isInRecordingSession = $derived(
		recorderState === 'SESSION+RECORDING' || recorderState === 'SESSION',
	);

	const TranscriptionService = $derived.by(() => {
		switch (settings.value.selectedTranscriptionService) {
			case 'OpenAI':
				return createTranscriptionServiceWhisperLive({
					HttpService,
				});
			case 'Groq':
				return createTranscriptionServiceGroqLive({
					HttpService,
				});
			case 'faster-whisper-server':
				return createTranscriptionServiceFasterWhisperServerLive({
					HttpService,
				});
		}
	});

	const setRecorderState = (newValue: WhisperingRecordingState) => {
		recorderState = newValue;
		const updateTrayIcon = async () => {
			const result = await SetTrayIconService.setTrayIcon(newValue);
			if (!result.ok) {
				renderErrAsToast({
					variant: 'warning',
					title: `🚫 Could not set tray icon to ${recorderState} icon...`,
					description: 'Please check your system tray settings',
					action: { type: 'more-details', error: result.error },
				});
			}
		};
		void updateTrayIcon();
	};

	const stopRecordingAndTranscribeAndCopyToClipboardAndPasteToCursorWithToast =
		async () => {
			const stopRecordingToastId = nanoid();
			toast.loading({
				id: stopRecordingToastId,
				title: '⏸️ Stopping recording...',
				description: 'Finalizing your audio capture...',
			});

			const stopResult = await RecorderService.stopRecording(undefined, {
				sendStatus: (options) =>
					toast.loading({ id: stopRecordingToastId, ...options }),
			});

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

			toast.loading({
				title: '✨ Recording Complete!',
				description: settings.value.isFasterRerecordEnabled
					? 'Recording saved! Ready for another take'
					: 'Recording saved and session closed successfully',
			});

			const [
				_transcribeAndCopyAndPasteWithToastResult,
				_closeSessionIfNeededWithToastResult,
			] = await Promise.all([
				(async () => {
					const setStatusTranscribingResult =
						await RecordingsService.updateRecording({
							...newRecording,
							transcriptionStatus: 'TRANSCRIBING',
						});
					if (!setStatusTranscribingResult.ok) {
						toast.warning({
							title:
								'⚠️ Unable to set recording transcription status to transcribing',
							description: 'Continuing with the transcription process...',
							action: {
								type: 'more-details',
								error: setStatusTranscribingResult.error,
							},
						});
					}

					transcribingRecordingIds.add(newRecording.id);
					const transcribeResult = await TranscriptionService.transcribe(
						newRecording.blob,
					);
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
							title: '⚠️ Unable to update recording after transcription',
							description:
								"Transcription completed but unable to update recording's transcribed text and status in database",
							action: {
								type: 'more-details',
								error: saveRecordingToDatabaseResult.error,
							},
						});
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
											text: updatedRecording.transcribedText,
										}),
								},
							});
							return;
						}
					}

					if (!settings.value.isPasteContentsOnSuccessEnabled) {
						toast.success({
							id: stopRecordingToastId,
							title: '📋 Recording transcribed and copied to clipboard!',
							description: updatedRecording.transcribedText,
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
					const pasteResult = await ClipboardService.writeTextToCursor(
						updatedRecording.transcribedText,
					);
					if (!pasteResult.ok) {
						toast.success({
							id: stopRecordingToastId,
							title: '📋 Recording transcribed and copied to clipboard!',
							description: updatedRecording.transcribedText,
							descriptionClass: 'line-clamp-2',
						});
						return;
					}
					toast.success({
						id: stopRecordingToastId,
						title: '✅ Recording transcribed, copied to clipboard, and pasted!',
						description: updatedRecording.transcribedText,
						descriptionClass: 'line-clamp-2',
					});
				})(),
				(async () => {
					if (settings.value.isFasterRerecordEnabled) return;
					toast.loading({
						id: stopRecordingToastId,
						title: '⏳ Closing session...',
						description: 'Wrapping up your recording session...',
					});
					const closeSessionResult =
						await RecorderService.closeRecordingSession(undefined, {
							sendStatus: (options) =>
								toast.loading({ id: stopRecordingToastId, ...options }),
						});
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
					setRecorderState('IDLE');
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
		if (!isInRecordingSession) {
			const initResult = await RecorderService.initRecordingSession(
				{
					deviceId: settings.value.selectedAudioInputDeviceId,
					bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
				},
				{
					sendStatus: (options) =>
						toast.loading({ id: startRecordingToastId, ...options }),
				},
			);
			if (!initResult.ok) {
				toast.error({
					id: startRecordingToastId,
					title: '❌ Failed to Initialize Recording Session',
					description:
						'Could not start a new recording session. This might be due to microphone permissions or device connectivity issues. Please check your audio settings and try again.',
					action: { type: 'more-details', error: initResult.error },
				});
				return;
			}
		}
		const startRecordingResult = await RecorderService.startRecording(
			nanoid(),
			{
				sendStatus: (options) =>
					toast.loading({ id: startRecordingToastId, ...options }),
			},
		);
		if (!startRecordingResult.ok) {
			toast.error({
				id: startRecordingToastId,
				title: '❌ Failed to Start Recording',
				description:
					'Unable to begin recording audio. Please check if your microphone is properly connected and permissions are granted.',
				action: { type: 'more-details', error: startRecordingResult.error },
			});
			return;
		}
		setRecorderState('SESSION+RECORDING');
		toast.success({
			id: startRecordingToastId,
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
			const closeResult = await RecorderService.closeRecordingSession(
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

		toggleRecordingWithToast: () => {
			if (isInRecordingSession) {
				void stopRecordingAndTranscribeAndCopyToClipboardAndPasteToCursorWithToast();
			} else {
				void startRecordingWithToast();
			}
		},

		cancelRecordingWithToast: async () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
			});
			const cancelResult = await RecorderService.cancelRecording(undefined, {
				sendStatus: (options) => toast.loading({ id: toastId, ...options }),
			});
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
				const closeSessionResult = await RecorderService.closeRecordingSession(
					undefined,
					{
						sendStatus: (options) => toast.loading({ id: toastId, ...options }),
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
			}
			void playSound('cancel');
			setRecorderState('IDLE');
			console.info('Recording cancelled');
		},

		transcribeAndUpdateRecordingWithToast: async (recording: Recording) => {
			const toastId = nanoid();
			const transcriptionResult = await TranscriptionService.transcribe(
				recording.blob,
			);
			if (!transcriptionResult.ok) {
				toast.error({ id: toastId, ...transcriptionResult.error });
				return;
			}
			const transcribedText = transcriptionResult.data;
			const updatedRecording = {
				...recording,
				transcribedText,
				transcriptionStatus: 'DONE',
			} satisfies Recording;
			const updateRecordingResult =
				await RecordingsService.updateRecording(updatedRecording);
			if (!updateRecordingResult.ok) {
				toast.error({ id: toastId, ...updateRecordingResult.error });
				return;
			}
			toast.success({
				id: toastId,
				title: '📋 Recording transcribed!',
				description: transcribedText,
				descriptionClass: 'line-clamp-2',
				action: {
					type: 'button',
					label: 'Go to recordings',
					onClick: () =>
						clipboard.copyTextToClipboardWithToast({
							label: 'transcribed text',
							text: transcribedText,
						}),
				},
			});
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
