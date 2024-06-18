import type { PlasmoMessaging } from '@plasmohq/messaging';
import { effectToResult, type Result, type Settings } from '@repo/shared';
import { Effect } from 'effect';
import { contentCommands } from '~background/contentScriptCommands';
import { renderErrorAsToast } from '~lib/errors';

export type RequestBody = {};

export type ResponseBody = Result<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const settings = yield* contentCommands.getSettings();
		return settings;
	}).pipe(
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
