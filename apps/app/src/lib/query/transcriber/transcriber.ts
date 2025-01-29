import { getContext, setContext } from 'svelte';
import { useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste } from './mutations';
import { useIsCurrentlyTranscribing } from './queries';

export type Transcriber = ReturnType<typeof createTranscriber>;

export const initTranscriberInContext = () => {
	const transcriber = createTranscriber();
	setContext('transcriber', transcriber);
	return transcriber;
};

export const getTranscriberFromContext = () => {
	return getContext<Transcriber>('transcriber');
};

function createTranscriber() {
	const isCurrentlyTranscribing = useIsCurrentlyTranscribing();
	const transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste =
		useTranscribeAndUpdateRecordingWithToastWithSoundWithCopyPaste();

	return {
		get isCurrentlyTranscribing() {
			return isCurrentlyTranscribing.data ?? false;
		},
		transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste:
			transcribeAndUpdateRecordingWithToastWithSoundWithCopyPaste.mutate,
	};
}
