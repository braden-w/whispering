import { Context, Data, Effect } from 'effect';

export class SyncServiceError extends Data.TaggedError('SyncServiceError')<{
	message: string;
	origError?: unknown;
}> {}

export class SyncService extends Context.Tag('SyncService')<
	SyncService,
	{
		readonly syncWhisperingLocalStorageToExtensionLocalStorage: Effect.Effect<
			void,
			SyncServiceError
		>;
	}
>() {}
