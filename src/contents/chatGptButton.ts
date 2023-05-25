import type { PlasmoContentScript } from 'plasmo';

import { startRecording } from '~lib/recorder/mediaRecorder';
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
		const svg = document.querySelector('#plasmo-icon');

		if (button) {
			button.addEventListener('click', async () => {
				await startRecording();
				sendMessageToBackground({ action: 'setIcon', icon: 'octagonalSign' });

				svg.innerHTML = `
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
					/>
				`;
			});
		}
	}
};
