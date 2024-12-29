import type { WhisperingResult, WhisperingSoundNames } from '@repo/shared';

export type PlaySoundService = {
	playSound: (
		soundName: WhisperingSoundNames,
	) => Promise<WhisperingResult<void>>;
};
