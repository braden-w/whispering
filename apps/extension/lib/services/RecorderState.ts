import type { Effect } from 'effect';
import { Context } from 'effect';
import { ExtensionStorageError } from './storage';
import type { RecorderState } from './RecorderService';

export class RecorderStateService extends Context.Tag('RecorderStateService')<
	RecorderStateService,
	{
		readonly get: () => Effect.Effect<RecorderState, ExtensionStorageError>;
		readonly set: (value: RecorderState) => Effect.Effect<void, ExtensionStorageError>;
	}
>() {}
