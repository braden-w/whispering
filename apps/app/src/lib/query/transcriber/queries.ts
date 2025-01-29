import { DbRecordingsService, createResultQuery } from '$lib/services';
import { Ok } from '@epicenterhq/result';

export const transcriberKeys = {
	isCurrentlyTranscribing: ['transcriber', 'isCurrentlyTranscribing'] as const,
};

export function useIsCurrentlyTranscribing() {
	return createResultQuery(() => ({
		queryKey: transcriberKeys.isCurrentlyTranscribing,
		queryFn: async () => {
			const transcribingRecordingIdsResult =
				await DbRecordingsService.getTranscribingRecordingIds();
			if (!transcribingRecordingIdsResult.ok)
				return transcribingRecordingIdsResult;
			return Ok(transcribingRecordingIdsResult.data.length > 0);
		},
	}));
}
