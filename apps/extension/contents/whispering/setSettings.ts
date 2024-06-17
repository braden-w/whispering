import { WhisperingError, type Settings } from '@repo/shared';
import { Effect } from 'effect';
import { localStorageService } from '~lib/services/local-storage';

export const setSettings = (settings: Settings) =>
	localStorageService
		.set({
			key: 'whispering-settings',
			value: settings,
		})
		.pipe(
			Effect.catchTags({
				SetLocalStorageError: (error) =>
					new WhisperingError({
						title: 'Unable to set Whispering settings',
						description:
							error instanceof Error
								? error.message
								: 'An error occurred while setting Whispering settings.',
						error,
					}),
			}),
		);
