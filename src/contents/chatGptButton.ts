import type { PlasmoCSConfig } from 'plasmo';
import type { Icon } from '~background/setIcon';
import { writeTextToCursor } from '~lib/apis/clipboard';
import { sendMessageToBackground, type MessageToContentScriptRequest } from '~lib/utils/messaging';

import { toggleRecording } from './toggleRecording';

export const config: PlasmoCSConfig = {
	matches: ['https://chat.openai.com/*']
};

chrome.runtime.onMessage.addListener(async function (message: MessageToContentScriptRequest) {
	if (message.command === 'toggle-recording')
		await toggleRecording({
			switchIcon: (icon) => {
				sendMessageToBackground({ action: 'setIcon', icon });
				switchMicrophoneIcon(icon);
			},
			onSuccess: (text: string) => writeTextToCursor(text)
		});
});

const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.type === 'childList') {
			injectMicrophoneButtonIntoTextarea();
		}
	});
});

window.onload = function () {
	injectMicrophoneButtonIntoTextarea();

	const config = { childList: true, subtree: true };
	observer.observe(document.body, config); // adjust this to the element you want to observe
};

window.onunload = function () {
	observer.disconnect();
};

function injectMicrophoneButtonIntoTextarea() {
	const textarea = document.querySelector('#prompt-textarea');

	if (textarea && !document.querySelector('#whispering-microphone-button')) {
		// We use a div instead of a button because when using a button, clicking the microphone somehow triggers the chat input to submit
		const buttonHTML = /*html*/ `
<div
	id="whispering-microphone-button"
	class="absolute p-1 rounded-md text-gray-500 bottom-1.5 md:bottom-2.5 hover:bg-gray-100 enabled:dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent right-1 md:right-2 disabled:opacity-40"
	style="right: 2.25rem; @media (min-width: 768px) { right: 2.5rem; }"
>
	<svg
		id="whispering-microphone-svg"
		stroke="currentColor"
		fill="none"
		stroke-width="2"
		viewBox="0 0 24 24"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="h-4 w-4"
		height="1em"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
	>
		${iconToSvgInnerHtml.studioMicrophone}
	</svg>
</div>
`;

		textarea.insertAdjacentHTML('afterend', buttonHTML);

		const button = document.querySelector('#whispering-microphone-button');
		if (!button) return;

		button.addEventListener('click', async () => {
			toggleRecording({
				onSuccess: (text) => setChatgptTextareaContent(text),
				switchIcon: (icon) => {
					sendMessageToBackground({ action: 'setIcon', icon });
					switchMicrophoneIcon(icon);
				}
			});
		});
	}
}

const iconToSvgInnerHtml: Record<Icon, string> = {
	studioMicrophone: /*html*/ `
		<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
		<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
		<line x1="12" y1="19" x2="12" y2="23"></line>
		<line x1="8" y1="23" x2="16" y2="23"></line>
	`,
	octagonalSign: /*html*/ `
		<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
		/>
	`,
	arrowsCounterclockwise: /*html*/ `
		<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
		/>
	`
};

function switchMicrophoneIcon(icon: Icon) {
	sendMessageToBackground({ action: 'setIcon', icon });

	setSvgInnerHtmlToIcon(icon);

	if (icon === 'arrowsCounterclockwise') setButtonIsDisabled(true);
	else setButtonIsDisabled(false);
}

function setChatgptTextareaContent(text) {
	const textarea: HTMLTextAreaElement = document.querySelector('#prompt-textarea');
	if (!textarea) return;

	textarea.value = text;

	const event = new Event('input', { bubbles: true });
	textarea.dispatchEvent(event);
}

function setSvgInnerHtmlToIcon(icon: Icon) {
	const svg: SVGElement = document.querySelector('#whispering-microphone-svg');
	if (!svg) return;

	svg.innerHTML = iconToSvgInnerHtml[icon];
}

function setButtonIsDisabled(isDisabled: boolean) {
	const button: HTMLButtonElement = document.querySelector('#whispering-microphone-button');
	if (!button) return;

	button.disabled = isDisabled;
}
