import {
	createResultMutation,
	playSoundIfEnabled,
	userConfiguredServices
} from '$lib/services';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import type { WhisperingErrProperties } from '@repo/shared';
import type { Accessor } from '../types';

export function useCancelRecorderWithToast(toastId: Accessor<string>) {
	return createResultMutation(() => ({
		onMutate: () => {
			toast.loading({
				id: toastId(),
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
			});
		},
		mutationFn: async () => {
			const cancelResult =
				await userConfiguredServices.recorder.cancelRecording(undefined, {
					sendStatus: (options) => toast.loading({ id: toastId(), ...options }),
				});
			return cancelResult;
		},
		onSuccess: async (_data, _variables, ctx) => {
			// await setRecorderState('SESSION');
			if (settings.value['recording.isFasterRerecordEnabled']) {
				toast.success({
					id: toastId(),
					title: '🚫 Recording Cancelled',
					description:
						'Recording discarded, but session remains open for a new take',
				});
				// await setRecorderState('SESSION');
			} else {
				toast.loading({
					id: toastId(),
					title: '⏳ Closing session...',
					description: 'Wrapping up your recording session...',
				});
				const closeSessionResult =
					await userConfiguredServices.recorder.closeRecordingSession(
						undefined,
						{
							sendStatus: (options) =>
								toast.loading({ id: toastId(), ...options }),
						},
					);
				if (!closeSessionResult.ok) {
					switch (closeSessionResult.error._tag) {
						case 'NoActiveSession':
							// await setRecorderState('IDLE');
							return;
						case 'WhisperingError':
							toast.error({
								id: toastId(),
								title: '❌ Failed to close session while cancelling recording',
								description:
									'Your recording was cancelled but we encountered an issue while closing your session. You may need to restart the application.',
								action: {
									type: 'more-details',
									error: closeSessionResult.error,
								},
							});
							return;
					}
				}
				toast.success({
					id: toastId(),
					title: '✅ All Done!',
					description: 'Recording cancelled and session closed successfully',
				});
				// await setRecorderState('IDLE');
			}
			void playSoundIfEnabled('cancel');
			console.info('Recording cancelled');
		},
		onError: (error) => {
			toast.error({ id: toastId(), ...error });
		},
	}));
}

export function useCloseRecordingSessionWithToast(toastId: Accessor<string>) {
	return createResultMutation<
		void,
		WhisperingErrProperties | { _tag: 'NoActiveSession' }
	>(() => ({
		onMutate: () => {
			toast.loading({
				id: toastId(),
				title: '⏳ Closing recording session...',
				description: 'Wrapping things up, just a moment...',
			});
		},
		mutationFn: async () => {
			const closeResult =
				await userConfiguredServices.recorder.closeRecordingSession(undefined, {
					sendStatus: (options) => toast.loading({ id: toastId(), ...options }),
				});
			return closeResult;
		},
		onError: async (error) => {
			switch (error._tag) {
				case 'NoActiveSession':
					// await setRecorderState('IDLE');
					return;
				case 'WhisperingError':
					toast.error({ id: toastId(), ...error });
					return;
			}
		},
		onSuccess: async () => {
			// await setRecorderState('IDLE');
			toast.success({
				id: toastId(),
				title: '✨ Session Closed Successfully',
				description: 'Your recording session has been neatly wrapped up',
			});
		},
	}));
}
