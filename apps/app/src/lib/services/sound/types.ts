import type { WhisperingSoundNames } from '$lib/constants/sounds';
import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';

export const { PlaySoundServiceError, PlaySoundServiceErr } = createTaggedError(
	'PlaySoundServiceError',
);
export type PlaySoundServiceError = ReturnType<typeof PlaySoundServiceError>;

export type PlaySoundService = {
	playSound: (
		soundName: WhisperingSoundNames,
	) => Promise<Result<void, PlaySoundServiceError>>;
};
