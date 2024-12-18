import { sendToBackground } from '@plasmohq/messaging';
import { WhisperingError } from '@repo/shared';
import { Effect } from 'effect';
import type * as ToggleRecording from '~background/messages/whispering-web/toggleRecording';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceContentLive } from '~lib/services/NotificationServiceContentLive';

export const toggleRecordingFromContentScript = () =>
	Effect.tryPromise({
		try: () =>
			sendToBackground<
				ToggleRecording.RequestBody,
				ToggleRecording.ResponseBody
			>({
				name: 'whispering-web/toggleRecording',
			}),
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Unable to toggle recording via background service worker',
			description:
				'There was likely an issue sending the message to the background service worker from the contentscript.',
			action: {
				type: 'more-details',
				error,
			},
		}),
	}).pipe(
		Effect.catchAll(renderErrorAsNotification),
		Effect.provide(NotificationServiceContentLive),
		Effect.runPromise,
	);
