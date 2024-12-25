import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	type Settings,
	WhisperingErr,
	type WhisperingResult,
} from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~background/messages/getOrCreateWhisperingTabId';
import type { WhisperingStorageKey } from '~lib/storage/keys';

export type SetSettingsResponse = WhisperingResult<Settings>;

const setSettings = async (settings: Settings) => {
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
						variant: 'error',
						title: 'Unable to set Whispering settings',
						description: 'An error occurred while setting Whispering settings.',
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

const handler: PlasmoMessaging.MessageHandler<
	{ settings: Settings },
	SetSettingsResponse
> = async ({ body }, res) => {
	if (!body?.settings) {
		res.send(
			WhisperingErr({
				title: 'Error setting Whispering settings',
				description: 'Settings must be provided in the message request body',
			}),
		);
		return;
	}
	res.send(await setSettings(body.settings));
};

export default handler;
