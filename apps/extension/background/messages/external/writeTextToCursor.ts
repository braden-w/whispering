import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { ExternalMessage, ExternalMessageNameToReturnType, Result } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { injectScript } from '~background/injectScript';
import { getActiveTabId } from '~lib/background/external/getActiveTabId';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

const writeTextToCursor = (text: string): Effect.Effect<void, WhisperingError> =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		yield* injectScript<string, [string]>({
			tabId: activeTabId,
			commandName: 'writeTextToCursor',
			func: (text) => {
				const isDiv = (element: Element): element is HTMLDivElement => element.tagName === 'DIV';
				const isContentEditableDiv = (element: Element): element is HTMLDivElement =>
					isDiv(element) && element.isContentEditable;
				const isInput = (element: Element): element is HTMLInputElement =>
					element.tagName === 'INPUT';
				const isTextarea = (element: Element): element is HTMLTextAreaElement =>
					element.tagName === 'TEXTAREA';
				const insertTextIntoElement = (element: Element, text: string) => {
					if (isContentEditableDiv(element)) {
						try {
							document.execCommand('insertText', false, text);
						} catch (e) {
							// Fallback for older browsers
							const range = document.getSelection().getRangeAt(0);
							range.deleteContents();
							range.insertNode(document.createTextNode(text));
						}
					} else if (isInput(element) || isTextarea(element)) {
						const start = element.selectionStart ?? element.value.length;
						const end = element.selectionEnd ?? element.value.length;

						element.value = element.value.slice(0, start) + text + element.value.slice(end);
						element.selectionStart = start + text.length;
						element.selectionEnd = start + text.length;

						element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
					} else {
						console.warn('The active element is not editable.');
					}
				};

				const activeElement = document.activeElement;
				if (
					!activeElement ||
					(activeElement &&
						!isContentEditableDiv(activeElement) &&
						!isInput(activeElement) &&
						!isTextarea(activeElement))
				) {
					const textareas = document.getElementsByTagName('textarea');
					if (textareas.length === 1) {
						insertTextIntoElement(textareas[0]!, text);
						return {
							isSuccess: true,
							data: text,
						};
					}
					const contentEditables = document.querySelectorAll(
						'[contenteditable="true"], [contenteditable=""]',
					);
					if (contentEditables.length === 1) {
						insertTextIntoElement(contentEditables[0]!, text);
						return {
							isSuccess: true,
							data: text,
						};
					}
					return {
						isSuccess: false,
						error: {
							title: 'Unable to write transcribed text',
							description: 'No suitable element found in the document',
						},
					};
				}
				insertTextIntoElement(activeElement, text);
				return { isSuccess: true, data: text } as const;
			},
			args: [text],
		});
	}).pipe(
		Effect.catchTags({
			GetActiveTabIdError: () =>
				new WhisperingError({
					title: 'Unable to get active tab ID to write transcribed text to cursor',
					description:
						'Please try pasting or go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
				}),
		}),
	);

export type RequestBody = Extract<ExternalMessage, { name: 'external/writeTextToCursor' }>['body'];

export type ResponseBody = Result<ExternalMessageNameToReturnType['external/writeTextToCursor']>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.transcribedText) {
			return yield* new WhisperingError({
				title: 'Error invoking writeTextToCursor command',
				description: 'Text must be provided in the request body of the message',
			});
		}
		yield* writeTextToCursor(body.transcribedText);
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
