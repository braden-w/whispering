import { Effect } from 'effect';
import { recorder } from './stores/recorder';

export function toggleRecording() {
	recorder.toggleRecording
		.pipe(
			// Effect.catchTags({
			//   GetNavigatorMediaError
			// }),
			Effect.runPromise
		)
		.catch(console.error);
}
