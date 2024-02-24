import { Effect } from 'effect';
import { recordings } from '../recordings';
import { createRecorder } from './create-recorder';

export const recorder = createRecorder({
	onSuccessfulRecording: (newRecording) =>
		Effect.gen(function* (_) {
			yield* _(recordings.addRecording(newRecording));
			yield* _(recordings.transcribeRecording(newRecording.id));
		})
});
