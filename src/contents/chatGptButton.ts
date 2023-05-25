import type { PlasmoContentScript } from 'plasmo';

import type { Icon } from '~background/setIcon';
import { writeText } from '~lib/apis/clipboard';
import { startRecording, stopRecording } from '~lib/recorder/mediaRecorder';
import { getApiKey } from '~lib/stores/apiKey';
import { transcribeAudioWithWhisperApi } from '~lib/transcribeAudioWithWhisperApi';
import { sendMessageToBackground } from '~lib/utils/messaging';

console.log('🚀 ~ file: chatGptButton.ts:2 ~ PlasmoContentScript:');

export const config: PlasmoContentScript = {
	matches: ['https://chat.openai.com/*'],
	all_frames: true
};

window.onload = function () {
	const textarea = document.querySelector('#prompt-textarea');

	if (textarea) {
		const buttonHTML = /*html*/ `
<button
	id="plasmo-button"
	class="absolute p-1 rounded-md text-gray-500 bottom-1.5 md:bottom-2.5 hover:bg-gray-100 enabled:dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent right-1 md:right-2 disabled:opacity-40"
	style="right: 2.25rem; @media (min-width: 768px) { right: 2.5rem; }"
>
	<svg
		id="plasmo-icon"
		stroke="currentColor"
		fill="none"
		stroke-width="2"
		viewBox="0 0 24 24"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="h-4 w-4 mr-1"
		height="1em"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
		<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
		<line x1="12" y1="19" x2="12" y2="23"></line>
		<line x1="8" y1="23" x2="16" y2="23"></line>
	</svg>
</button>
`;

		textarea.insertAdjacentHTML('afterend', buttonHTML);

		const button = document.querySelector('#plasmo-button');

		let isRecording = false;

		if (button) {
			button.addEventListener('click', async () => {
				const apiKey = await getApiKey();
				if (!apiKey) {
					alert('Please set your API key in the extension options');
					openOptionsPage();
					return;
				}
				if (!isRecording) {
					await startRecording();
					switchIcon('octagonalSign');

					isRecording = true;
				} else {
					const audioBlob = await stopRecording();
					switchIcon('arrowsCounterclockwise');
					const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey);
					writeText(text);
					switchIcon('studioMicrophone');
					isRecording = false;
				}
			});
		}
	}
};

const iconToSvgInnerHtml: Record<Icon, string> = {
	studioMicrophone: `
	<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
	<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
	<line x1="12" y1="19" x2="12" y2="23"></line>
	<line x1="8" y1="23" x2="16" y2="23"></line>
		`,
	octagonalSign: `
	<path
	stroke-linecap="round"
	stroke-linejoin="round"
	d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
	/>
					`,
	arrowsCounterclockwise: `
	<path
	stroke-linecap="round"
	stroke-linejoin="round"
	d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
	/>
		`
};

function switchIcon(icon: Icon) {
	sendMessageToBackground({ action: 'setIcon', icon });
	const svg = document.querySelector('#plasmo-icon');
	if (!svg) return;
	svg.innerHTML = iconToSvgInnerHtml[icon];
}

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
