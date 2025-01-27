import { userConfiguredServices } from '$lib/services';
import type {
	WhisperingRecordingState,
	WhisperingErrProperties,
} from '@repo/shared';
import { createQuery } from '@tanstack/svelte-query';

export const recorderKeys = {
	all: ['recorder'] as const,
	state: ['recorder', 'state'] as const,
};

export function useRecorderState() {
	return createQuery<WhisperingRecordingState, WhisperingErrProperties>(() => ({
		queryKey: recorderKeys.state,
		queryFn: async () => {
			const recorderStateResult =
				await userConfiguredServices.recorder.getRecorderState();
			if (!recorderStateResult.ok) {
				throw recorderStateResult.error;
			}
			return recorderStateResult.data;
		},
	}));
}
