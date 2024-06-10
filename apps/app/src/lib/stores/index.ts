import { RecorderService } from '$lib/services/RecorderService';
import { RecorderServiceWebLive } from '$lib/services/RecorderServiceWebLive.svelte';
import { Effect } from 'effect';

export * from './recordings.svelte';
export * from './settings.svelte';

export const recorder = Effect.gen(function* () {
	const recorder = yield* RecorderService;
	return recorder;
}).pipe(Effect.provide(RecorderServiceWebLive), Effect.runSync);
