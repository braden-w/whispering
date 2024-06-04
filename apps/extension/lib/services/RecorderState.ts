import type { Effect } from 'effect';
import { Context } from 'effect';
import type { RecorderState } from '../../../../packages/services/src/services/recorder';
import { ExtensionStorageError } from './ExtensionStorage';

export class RecorderStateService extends Context.Tag('RecorderStateService')<
	RecorderStateService,
	{
		readonly get: () => Effect.Effect<RecorderState, ExtensionStorageError>;
		readonly set: (value: RecorderState) => Effect.Effect<void, ExtensionStorageError>;
	}
>() {}
