import { createResultQuery, userConfiguredServices } from '$lib/services';

export const recorderKeys = {
	all: ['recorder'] as const,
	state: ['recorder', 'state'] as const,
};

export function useRecorderState() {
	return {
		recorderState: createResultQuery(() => ({
			queryKey: recorderKeys.state,
			queryFn: async () => {
				const recorderStateResult =
					await userConfiguredServices.recorder.getRecorderState();
				return recorderStateResult;
			},
			initialData: 'IDLE' as const,
		})),
	};
}
