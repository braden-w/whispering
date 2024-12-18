import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { injectScript } from '~background/injectScript';
import { renderErrorAsNotification } from '~lib/errors';
import { getActiveTabId } from '~lib/getActiveTabId';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

const writeTextToCursor = (
	text: string,
): Effect.Effect<void, WhisperingError> => {
	return Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		yield* injectScript<string, [string]>({
			tabId: activeTabId,
			commandName: 'writeTextToCursor',
			func: (text) => {
				const isDiv = (element: Element): element is HTMLDivElement =>
					element.tagName === 'DIV';
				const isContentEditableDiv = (
					element: Element,
				): element is HTMLDivElement =>
					isDiv(element) && element.isContentEditable;
				const isInput = (element: Element): element is HTMLInputElement =>
					element.tagName === 'INPUT';
				const isTextarea = (element: Element): element is HTMLTextAreaElement =>
					element.tagName === 'TEXTAREA';
				const insertTextIntoInputOrTextarea = (
					element: HTMLInputElement | HTMLTextAreaElement,
					text: string,
				): void => {
					const start = element.selectionStart ?? element.value.length;
					const end = element.selectionEnd ?? element.value.length;

					element.value =
						element.value.slice(0, start) + text + element.value.slice(end);
					element.selectionStart = start;
					element.selectionEnd = start + text.length;

					element.dispatchEvent(
						new InputEvent('input', { bubbles: true, cancelable: true }),
					);
				};

				const insertTextIntoEditableElement = (
					element: HTMLDivElement | HTMLInputElement | HTMLTextAreaElement,
					text: string,
				) => {
					if (isInput(element) || isTextarea(element)) {
						insertTextIntoInputOrTextarea(element, text);
					} else if (isContentEditableDiv(element)) {
						try {
							document.execCommand('insertText', false, text);
						} catch (e) {
							// Fallback for older browsers
							const range = document.getSelection().getRangeAt(0);
							range.deleteContents();
							range.insertNode(document.createTextNode(text));
						}
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
					const textareas = Array.from(
						document.getElementsByTagName('textarea'),
					).filter(isTextarea);
					const contentEditableDivs = Array.from(
						document.querySelectorAll(
							'div[contenteditable="true"], div[contenteditable=""]',
						),
					).filter(isContentEditableDiv);
					const editables = [...textareas, ...contentEditableDivs];
					if (editables.length === 1) {
						insertTextIntoEditableElement(editables[0]!, text);
						return {
							ok: true,
							data: text,
						};
					}
					return {
						ok: false,
						error: {
							isWarning: true,
							title: 'Please paste the transcribed text manually',
							description:
								'There are multiple text areas or content editable divs on the page.',
						},
					};
				}
				insertTextIntoEditableElement(activeElement, text);
				return { ok: true, data: text } as const;
			},
			args: [text],
		});
	}).pipe(
		Effect.catchTags({
			GetActiveTabIdError: () => ({
				_tag: 'WhisperingError',
				title:
					'Unable to get active tab ID to write transcribed text to cursor',
				description:
					'Please try pasting or go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
				action: { type: 'none' },
			}),
		}),
	);
};

export type RequestBody =
	ExternalMessageBody<'whispering-extension/writeTextToCursor'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/writeTextToCursor'>
>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	{ body },
	res,
) =>
	Effect.gen(function* () {
		if (!body?.transcribedText) {
			return yield* {
				_tag: 'WhisperingError',
				title: 'Error invoking writeTextToCursor command',
				description: 'Text must be provided in the request body of the message',
				action: { type: 'none' },
			};
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
