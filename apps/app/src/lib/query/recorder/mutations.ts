import { playSoundIfEnabled, userConfiguredServices } from '$lib/services';
import { toast } from '$lib/services/toast';
import { settings } from '$lib/stores/settings.svelte';
import type { WhisperingErrProperties } from '@repo/shared';
import { createMutation } from '@tanstack/svelte-query';
import { nanoid } from 'nanoid/non-secure';

export function useCancelRecorderWithToast() {
	return createMutation<
		void,
		WhisperingErrProperties,
		void,
		{ toastId: string }
	>(() => ({
		onMutate: () => {
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
			});
			return { toastId };
		},
		mutationFn: async () => {
			const cancelResult =
				await userConfiguredServices.recorder.cancelRecording(undefined, {
					sendStatus: (options) => toast.loading({ id: toastId, ...options }),
				});
			if (!cancelResult.ok) {
				throw cancelResult.error;
			}
		},
		onSuccess: async (_data, _variables, ctx) => {
			if (!ctx) return;
			const { toastId } = ctx;
			// await setRecorderState('SESSION');
			if (settings.value['recording.isFasterRerecordEnabled']) {
				toast.success({
					id: toastId,
					title: '🚫 Recording Cancelled',
					description:
						'Recording discarded, but session remains open for a new take',
				});
				// await setRecorderState('SESSION');
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
					switch (closeSessionResult.error._tag) {
						case 'NoActiveSession':
							// await setRecorderState('IDLE');
							return;
						case 'WhisperingError':
							toast.error({
								id: toastId,
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
					id: toastId,
					title: '✅ All Done!',
					description: 'Recording cancelled and session closed successfully',
				});
				// await setRecorderState('IDLE');
			}
			void playSoundIfEnabled('cancel');
			console.info('Recording cancelled');
		},
		onError: (error, _, ctx) => {
			if (!ctx) return;
			const { toastId } = ctx;
			toast.error({ id: toastId, ...error });
		},
	}));
}
