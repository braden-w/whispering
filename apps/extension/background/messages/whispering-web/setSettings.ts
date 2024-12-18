import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Err, type Result, type Settings } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import type { WhisperingStorageKey } from '~lib/storage/keys';

export type RequestBody = { settings: Settings };

export type ResponseBody = Result<Settings>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async ({ body }, res) => {
	const setSettings = async () => {
		if (!body || !body.settings) {
			return Err({
				_tag: 'WhisperingError',
				title: 'Error setting Whispering settings',
				description: 'Settings must be provided in the message request body',
				action: { type: 'none' },
			});
		}
		const { settings } = body;
		const whisperingTabIdResult = await getOrCreateWhisperingTabId();
		if (!whisperingTabIdResult.ok) return whisperingTabIdResult;
		const whisperingTabId = whisperingTabIdResult.data;
		const returnedSettings = await injectScript<
			Settings,
			[WhisperingStorageKey, Settings]
		>({
			tabId: whisperingTabId,
			commandName: 'setSettings',
			func: (settingsKey, settings) => {
				try {
					localStorage.setItem(settingsKey, JSON.stringify(settings));
					return { ok: true, data: settings } as const;
				} catch (error) {
					return {
						ok: false,
						error: {
							_tag: 'WhisperingError',
							title: 'Unable to set Whispering settings',
							description:
								'An error occurred while setting Whispering settings.',
							action: {
								type: 'more-details',
								error,
							},
						},
					} as const;
				}
			},
			args: ['whispering-settings', settings],
		});
		return returnedSettings;
	};

	res.send(await setSettings());
};

export default handler;
