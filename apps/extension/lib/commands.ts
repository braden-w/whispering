import type { WhisperingErrorProperties } from '@repo/shared';
import { Data } from 'effect';

export class BackgroundServiceWorkerError extends Data.TaggedError(
	'BackgroundServiceWorkerError',
)<WhisperingErrorProperties> {}
