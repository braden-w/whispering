import type { RecorderState, WhisperingError } from '@repo/shared';
import type { Effect } from 'effect';
import { Context } from 'effect';

export class SetTrayIconService extends Context.Tag('SetTrayIconService')<
	SetTrayIconService,
	{
		setTrayIcon: (icon: RecorderState) => Effect.Effect<void, WhisperingError>;
	}
>() {}
