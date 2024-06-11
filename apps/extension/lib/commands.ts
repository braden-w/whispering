import { sendToBackground } from '@plasmohq/messaging';
import type { Result, WhisperingErrorProperties } from '@repo/shared';
import { Data, Effect } from 'effect';
import type { WhisperingMessage } from '~contents/whispering';

type AnyFunction = (...args: any[]) => any;
type CommandDefinition = Record<string, AnyFunction>;

export type Message<T extends CommandDefinition> = {
	[K in keyof T]: {
		commandName: K;
		args: Parameters<T[K]>;
	};
}[keyof T];

export type ExtensionMessage = WhisperingMessage;

type ExtractData<T> = T extends { isSuccess: true; data: infer U } ? U : never;
type ExtractError<T> = T extends { isSuccess: false; error: infer U } ? U : never;

export const sendToBgsw = <
	RequestBody,
	ResponseBody extends Result<any>,
	TData = ExtractData<ResponseBody>,
	TError = ExtractError<ResponseBody>,
>(
	...args: Parameters<typeof sendToBackground<RequestBody, ResponseBody>>
) =>
	Effect.tryPromise({
		try: () => sendToBackground<RequestBody, ResponseBody>(...args),
		catch: (error) =>
			new BackgroundServiceWorkerError({
				title: `Error sending message ${args[0].name} to background service worker`,
				description: error instanceof Error ? error.message : undefined,
				error,
			}),
	}).pipe(
		Effect.flatMap(({ data, error }) => {
			if (error) return Effect.fail(error as TError);
			return Effect.succeed(data as TData);
		}),
	);

export class BackgroundServiceWorkerError extends Data.TaggedError(
	'BackgroundServiceWorkerError',
)<WhisperingErrorProperties> {}
