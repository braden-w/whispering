import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { ExtensionStorageError } from './ExtensionStorage';

type RecordingState = 'IDLE' | 'RECORDING';

export class RecorderStateService extends Context.Tag('RecorderStateService')<
	RecorderStateService,
	{
		readonly get: () => Effect.Effect<RecordingState, ExtensionStorageError>;
		readonly set: (value: RecordingState) => Effect.Effect<void, ExtensionStorageError>;
	}
>() {}
