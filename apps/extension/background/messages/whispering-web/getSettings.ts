import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	getDefaultSettings,
	Ok,
	parseJson,
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

		const valueFromStorageResult = await injectScript<
			string | null,
			[WhisperingStorageKey]
		>({
			tabId: whisperingTabId,
			commandName: 'getSettings',
			func: (settingsKey) => {
				try {
					const valueFromStorage = localStorage.getItem(settingsKey);
					return { ok: true, data: valueFromStorage } as const;
				} catch (error) {
					return {
						ok: false,
						error: {
							_tag: 'WhisperingError',
							variant: 'error',
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
		if (!valueFromStorageResult.ok) return valueFromStorageResult;
		const valueFromStorage = valueFromStorageResult.data;

		if (valueFromStorage === null) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: 'Whispering settings not found',
				description: 'Local storage does not contain Whispering settings.',
			});
		}

		const parseJsonResult = parseJson(valueFromStorage);
		if (!parseJsonResult.ok)
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: 'Unable to parse Whispering settings',
				description:
					'There was an error parsing the Whispering settings from localStorage with JSON.parse.',
			});
		const maybeSettings = parseJsonResult.data;

		const parseResult = settingsSchema.safeParse(maybeSettings);
		if (!parseResult.success) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: 'Unable to parse Whispering settings',
				description:
					'There was an error running Schema.parseJson on the Whispering settings fetched from localStorage.',
				action: {
					type: 'more-details',
					error: parseResult.error,
				},
			});
		}
		const settings = parseResult.data;
		return Ok(settings);
	};

	res.send(await getSettings());
};

export default handler;
