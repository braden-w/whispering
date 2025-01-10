import type { WhisperingResult, WhisperingSoundNames } from '@repo/shared';

export type PlaySoundService = {
	[k in WhisperingSoundNames as `play${Capitalize<k>}Sound`]: () => Promise<
		WhisperingResult<void>
	>;
};
