import { createMutation } from '@repo/shared/epicenter-result';
import { settings } from '../stores/settingsService.svelte';
import { TranscriptionServiceWhisperLive } from '../services/TranscriptionServiceWhisperLive';
import { TranscriptionServiceGroqLive } from '../services/TranscriptionServiceGroqLive';
import { TranscriptionServiceFasterWhisperServerLive } from '../services/TranscriptionServiceFasterWhisperServerLive';
import { TranscribeAndUpdateService } from '$lib/stores/transcribeService.svelte';
import { toast } from '$lib/services/ToastService';

const transcribeAndUpdateRecording = createMutation({
	mutationFn: TranscribeAndUpdateService.transcribeAndUpdateRecording,
	onSuccess: async (transcribedText, { contextResult, input: recording }) => {
		toast.success({
			title: 'Transcription complete!',
			description: 'Check it out in your recordings',
			action: { type: 'link', label: 'Go to recordings', goto: '/recordings' },
		});
	},
	onError: async (error, { contextResult, input: recording }) => {
      toast.error({
        title: 'Error transcribing recording',
        description: transcribedText,
        action: { type: 'more-details', error },
      });
	},
});

	onMutate: async (recording: Recording) => {
		const isDocumentVisible = () => !document.hidden;
		const currentTranscribingRecordingToastId =
			`transcribing-${recording.id}` as const;
		const createStatusUpdater =
			(variant: 'loading' | 'success') => (options: ToastOptions) => {
				if (isDocumentVisible()) {
					toast[variant]({
						...options,
						id: currentTranscribingRecordingToastId,
					});
				} else {
					NotificationService.notify({
						...options,
						id: currentTranscribingRecordingToastId,
						variant,
					});
				}
			};

		const updateStatus = createStatusUpdater('loading');
		const succeedStatus = createStatusUpdater('success');
		const dismissToast = () => {
			toast.dismiss(currentTranscribingRecordingToastId);
			NotificationService.clear(currentTranscribingRecordingToastId);
		};

		updateStatus({
			id: currentTranscribingRecordingToastId,
			title: 'Transcribing...',
			description: 'Your recording is being transcribed.',
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: '/recordings',
			},
		});
		const newRecorder = {
			...recording,
			transcriptionStatus: 'TRANSCRIBING',
		} satisfies Recording;
		const setTranscribingStatusResult =
			await Recordings.updateRecording(newRecorder);
		if (!setTranscribingStatusResult.ok) {
			updateStatus({
				title: `Error updating recording ${recording.id} to transcribing`,
				description: 'Still trying to transcribe...',
			});
		}
		recordingsArray = recordingsArray.map((r) =>
			r.id === recording.id ? newRecorder : r,
		);

		return Ok({ updateStatus, succeedStatus, dismissToast });
	},
	onError: async (error, { contextResult, input: recording }) => {
		if (!contextResult.ok) {
			const error = contextResult.error;
			renderErrAsToast(error);
			return;
		}
		const { dismissToast } = contextResult.data;
		const updatedRecordingWithUnprocessedStatus = {
			...recording,
			transcriptionStatus: 'UNPROCESSED',
		} satisfies Recording;
		const updateRecordingResult = await Recordings.updateRecording(
			updatedRecordingWithUnprocessedStatus,
		);
		if (!updateRecordingResult.ok) {
			renderErrAsToast({
				_tag: 'WhisperingError',
				title: `Error rolling back recording ${recording.id} to unprocessed`,
				description: 'Please try re-recording.',
				action: {
					type: 'more-details',
					error: updateRecordingResult.error,
				},
			});
			return updateRecordingResult;
		}
		recordingsArray = recordingsArray.map((r) =>
			r.id === recording.id ? updatedRecordingWithUnprocessedStatus : r,
		);
		transcribingRecordingIds.delete(recording.id);
		dismissToast();
		return Ok(recording);
	},
});

const transcribeAndUpdateRecordingAndCopyToClipboard = createMutation({
	mutationFn: TranscribeAndUpdateService.transcribeAndUpdateRecordingAndCopyToClipboard,
  onSuccess: async (transcribedText, { contextResult, input: recording }) => {
    			toast.success({
				title: 'Transcription completed and copied to clipboard!',
				description: transcribedText,
				action: {
					type: 'link',
					label: 'Go to recordings',
					goto: '/recordings',
				},
			});
  }
});

const transcribeAndUpdateRecordingAndCopyToClipboardAndPasteToCursor =
	createMutation({
		mutationFn: TranscribeAndUpdateService.transcribeAndUpdateRecordingAndCopyToClipboardAndPasteToCursor,
    onSuccess: async (transcribedText, { contextResult, input: recording }) => {
      toast.success({
        title: 'Transcription completed, copied to clipboard, and pasted to cursor!',
        description: transcribedText,
        action: { type: 'link', label: 'Go to recordings', goto: '/recordings' },
      });

    },
	});
