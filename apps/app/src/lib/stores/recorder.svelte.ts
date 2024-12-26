import { WhisperingRecorderService } from '$lib/services/recorder';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import { recordings, type Recording } from '$lib/services/db';
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

	const closeRecordingSession = createMutation({
		mutationFn: (_, { context: { localToast } }) =>
			WhisperingRecorderService.closeRecordingSession(undefined, {
				sendStatus: localToast.loading,
			}),
		onMutate: () => {
			const localToast = createLocalToastFns();
			localToast.loading({
				title: '⏳ Closing recording session...',
				description: 'Wrapping things up, just a moment...',
			});
			return Ok({ localToast });
		},
		onSuccess: (_, { context: { localToast } }) => {
			setRecorderState('IDLE');
			localToast.success({
				title: '✨ Session Closed Successfully',
				description: 'Your recording session has been neatly wrapped up',
			});
		},
		onError: (error, { contextResult }) => {
			if (!contextResult.ok) return;
			const { localToast } = contextResult.data;
			localToast.error(error);
		},
	});

	const cancelRecording = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const cancelResult = await WhisperingRecorderService.cancelRecording(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!cancelResult.ok) {
				return WhisperingErr({
					title: '❌ Failed to Cancel Recording',
					description:
						'Unable to cancel the current recording. The recording may still be in progress. Try stopping it instead.',
					action: { type: 'more-details', error: cancelResult.error },
				});
			}
			setRecorderState('SESSION');
			if (settings.value.isFasterRerecordEnabled) return Ok(undefined);

			localToast.loading({
				title: '⏳ Closing session...',
				description: 'Wrapping up your recording session...',
			});
			const closeResult = await WhisperingRecorderService.closeRecordingSession(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!closeResult.ok) {
				return WhisperingErr({
					title: '❌ Failed to Close Session',
					description: 'We encountered an issue while closing your session',
					action: { type: 'more-details', error: closeResult.error },
				});
			}
			setRecorderState('IDLE');
			return Ok(undefined);
		},
		onMutate: () => {
			const localToast = createLocalToastFns();
			localToast.loading({
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
			});
			return Ok({ localToast });
		},
		onSuccess: async (_, { context: { localToast } }) => {
			void playSound('cancel');
			console.info('Recording cancelled');
			if (settings.value.isFasterRerecordEnabled) {
				localToast.success({
					title: '🚫 Recording Cancelled',
					description:
						'Recording discarded, but session remains open for a new take',
				});
			} else {
				localToast.success({
					title: '✅ All Done!',
					description: 'Recording cancelled and session closed successfully',
				});
			}
		},
		onError: (error, { contextResult }) => {
			if (!contextResult.ok) return;
			const { localToast } = contextResult.data;
			localToast.error(error);
		},
	});

	return {
		get recorderState() {
			return recorderState;
		},
		get isInRecordingSession() {
			return isInRecordingSession;
		},
		closeRecordingSession,
		toggleRecording() {
			if (isInRecordingSession) {
				const stopRecordingWithToast = createMutation({
					mutationFn: async (_, { context: { localToast } }) => {
						const stopResult = await WhisperingRecorderService.stopRecording(
							undefined,
							{ sendStatus: localToast.loading },
						);
						if (!stopResult.ok) return stopResult;
						setRecorderState('SESSION');

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
							await recordings.addRecording(newRecording);
						if (!saveRecordingToDatabaseResult.ok) {
							return WhisperingErr({
								title: '❌ Failed to Save Recording',
								description:
									'Your recording was completed but could not be saved to the library. This might be due to storage limitations or permissions.',
								action: {
									type: 'more-details',
									error: saveRecordingToDatabaseResult.error,
								},
							});
						}

						const closeSessionWithToastIfNeeded = createMutation({
							mutationFn: async () => {
								if (settings.value.isFasterRerecordEnabled)
									return Ok(undefined);
								localToast.loading({
									title: '⏳ Closing session...',
									description: 'Wrapping up your recording session...',
								});
								const closeSessionResult =
									await WhisperingRecorderService.closeRecordingSession(
										undefined,
										{
											sendStatus: localToast.loading,
										},
									);
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
								return Ok(undefined);
							},
							onError: (error) => renderErrAsToast(error),
						});

						const createTranscriptionJob = createMutation({
							mutationFn: async () => {
								const transcribeRecordingAndUpdateDbResult =
									await transcriptionManager.transcribeRecordingAndUpdateDb(
										newRecording,
									);
								if (!transcribeRecordingAndUpdateDbResult.ok)
									return transcribeRecordingAndUpdateDbResult;

								const updatedRecording =
									transcribeRecordingAndUpdateDbResult.data;

								if (!settings.value.isCopyToClipboardEnabled) {
									localToast.success({
										title: 'Recording transcribed!',
										description: updatedRecording.transcribedText,
										descriptionClass: 'line-clamp-2',
									});
								}

								if (settings.value.isCopyToClipboardEnabled) {
									localToast.loading({
										title: '⏳ Copying to clipboard...',
										description:
											'Copying the transcription to your clipboard...',
									});
									const copyResult = await ClipboardService.setClipboardText(
										updatedRecording.transcribedText,
									);
									if (!copyResult.ok) {
										localToast.success({
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
									localToast.loading({
										title: '⏳ Pasting ...',
										description: 'Pasting the transcription to your cursor...',
									});
									const pasteResult = await ClipboardService.writeTextToCursor(
										updatedRecording.transcribedText,
									);
									if (!pasteResult.ok) {
										localToast.success({
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
								localToast.success({
									title:
										'Recording transcribed, copied to clipboard, and pasted!',
									description: updatedRecording.transcribedText,
									descriptionClass: 'line-clamp-2',
								});
								return Ok(undefined);
							},
							onError: (error) => renderErrAsToast(error),
						});

						await Promise.allSettled([
							createTranscriptionJob(undefined),
							closeSessionWithToastIfNeeded(undefined),
						]);
						return Ok(undefined);
					},
					onMutate: () => {
						const localToast = createLocalToastFns();
						localToast.loading({
							title: '⏸️ Stopping recording...',
							description: 'Finalizing your audio capture...',
						});
						return Ok({ localToast });
					},
					onSuccess: (_, { context: { localToast } }) => {
						localToast.success({
							title: '✨ Recording Complete!',
							description: settings.value.isFasterRerecordEnabled
								? 'Recording saved! Ready for another take'
								: 'Recording saved and session closed successfully',
						});
						console.info('Recording stopped');
						void playSound('stop');
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
				stopRecordingWithToast(undefined);
			} else {
				const startRecordingWithToast = createMutation({
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
					onMutate: () => {
						const localToast = createLocalToastFns();
						localToast.loading({
							title: '🎙️ Preparing to record...',
							description: 'Setting up your recording environment...',
						});
						return Ok({ localToast });
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
		cancelRecording: () => cancelRecording(undefined),
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
