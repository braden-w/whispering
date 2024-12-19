import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	getDefaultSettings,
	Ok,
	settingsSchema,
	WhisperingErr,
	type Settings,
	type WhisperingResult,
} from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import type { WhisperingStorageKey } from '~lib/storage/keys';

export type RequestBody = Record<string, never>;

export type ResponseBody = WhisperingResult<Settings>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async (_req, res) => {
	const getSettings = async () => {
		const getWhisperingTabIdResult = await getOrCreateWhisperingTabId();
		if (!getWhisperingTabIdResult.ok) return getWhisperingTabIdResult;
		const whisperingTabId = getWhisperingTabIdResult.data;

		const valueFromStorage = await injectScript<
			string | null,
			[WhisperingStorageKey]
		>({
			tabId: whisperingTabId,
			commandName: 'getSettings',
			func: (settingsKey) => {
				try {
					const valueFromStorage = localStorage.getItem(settingsKey);
					if (valueFromStorage === null)
						return {
							ok: false,
							error: {
								_tag: 'WhisperingError',
								title: 'Whispering settings not found',
								description:
									'Local storage does not contain Whispering settings.',
							},
						};
					const value = JSON.parse(valueFromStorage);
					return { ok: true, data: value } as const;
				} catch (error) {
					return {
						ok: false,
						error: {
							_tag: 'WhisperingError',
							title: 'Unable to get Whispering settings',
							description:
								'There was an error getting the Whispering settings from localStorage.',
							action: {
								type: 'more-details',
								error,
							},
						},
					} as const;
				}
			},
			args: ['whispering-settings'],
		});

		if (valueFromStorage === null) return Ok(getDefaultSettings('extension'));
		const parseResult = settingsSchema.safeParse(valueFromStorage);
		if (!parseResult.success)
			return WhisperingErr({
				title: 'Unable to parse Whispering settings',
				description:
					'There was an error running Schema.parseJson on the Whispering settings fetched from localStorage.',
				action: {
					type: 'more-details',
					error: parseResult.error,
				},
			});
		const settings = parseResult.data;
		return Ok(settings);
	};

	res.send(await getSettings());
};

export default handler;
