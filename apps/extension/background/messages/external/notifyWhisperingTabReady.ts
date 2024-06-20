import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

export type RequestBody = {};

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
