import { Effect } from 'effect';
import { WhisperingError } from '@repo/shared';
import { localStorageService, type Settings } from '~lib/services/local-storage';

const handler = (settings: Settings) =>
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

export default handler;
