import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	WhisperingResult,
} from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import { injectScript } from '~background/injectScript';
import { getActiveTabId } from '~lib/getActiveTabId';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/writeTextToCursor'>;

export type ResponseBody =
	ExternalMessageReturnType<'whispering-extension/writeTextToCursor'>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async ({ body }, res) => {
	const writeTextToCursor = async (): Promise<WhisperingResult<string>> => {
		if (!body?.transcribedText) {
			return WhisperingErr({
				title: 'Error invoking writeTextToCursor command',
				description: 'Text must be provided in the request body of the message',
			});
		}

		const activeTabIdResult = await getActiveTabId();
		if (!activeTabIdResult.ok) {
			return WhisperingErr({
				title: 'Unable to automatically paste transcribed text',
				description: 'Error getting active tab ID',
				action: { type: 'more-details', error: activeTabIdResult.error },
			});
		}
		const activeTabId = activeTabIdResult.data;
		if (!activeTabId) {
			return WhisperingErr({
				title: 'Unable to automatically paste transcribed text',
				description:
					'No active tab ID found to automatically paste the transcribed text. Please try manually pasting from your clipboard',
			});
		}
		return injectScript<string, [string]>({
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
							_tag: 'WhisperingError',
							variant: 'error',
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
			args: [body.transcribedText],
		});
	};
	res.send(await writeTextToCursor());
};

export default handler;
