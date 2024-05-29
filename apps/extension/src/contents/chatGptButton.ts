import type { PlasmoCSConfig } from 'plasmo';
import { writeTextToCursor } from '$lib/apis/clipboard';
import { sendMessageToBackground, type MessageToContentScriptRequest } from '$lib/utils/messaging';

export const config: PlasmoCSConfig = {
	matches: ['https://chat.openai.com/*'],
};

chrome.runtime.onMessage.addListener(async function (message: MessageToContentScriptRequest) {
	if (message.command === 'toggle-recording')
		await toggleRecording({
			switchIcon: (icon) => {
				sendMessageToBackground({ action: 'setExtensionIcon', icon });
				switchMicrophoneButtonIcon(icon);
			},
			onSuccessfulTranscription: (text: string) => writeTextToCursor(text),
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
	class= "absolute p-1 rounded-md bottom-[10px] md:bottom-3 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-900 dark:disabled:hover:bg-transparent disabled:text-gray-400 enabled:bg-brand-purple text-gray-500 dark:text-white transition-colors disabled:opacity-40"
	style="right: 3.0rem; @media (min-width: 768px) { right: 3.5rem; }"
>
	<svg
		id="whispering-microphone-svg"
		stroke="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		class="h-4 w-4"
		stroke-width="2"
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
				onSuccessfulTranscription: (text) => setChatgptTextareaContent(text),
				switchIcon: (icon) => {
					sendMessageToBackground({ action: 'setExtensionIcon', icon });
					switchMicrophoneButtonIcon(icon);
				},
			});
		});
	}
}

const iconToSvgInnerHtml: Record<Icon, string> = {
	studioMicrophone: /*html*/ `
		<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
		<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
		<line x1="12" x2="12" y1="19" y2="22" />
	`,
	redLargeSquare: /*html*/ `
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
	`,
};

function switchMicrophoneButtonIcon(icon: Icon) {
	sendMessageToBackground({ action: 'setExtensionIcon', icon });

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
