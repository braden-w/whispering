import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { WhisperingError } from '@repo/shared';

export const openOptionsPage = Effect.tryPromise({
	try: () => chrome.runtime.openOptionsPage(),
	catch: (error) =>
		new WhisperingError({
			title: 'Error opening options page',
			description: error instanceof Error ? error.message : `Unknown error: ${error}`,
			error,
		}),
}).pipe(Effect.catchAll(renderErrorAsToast));

const handler: PlasmoMessaging.MessageHandler<{}, Result<true>> = (req, res) =>
	Effect.gen(function* () {
		yield* openOptionsPage;
		return true as const;
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
