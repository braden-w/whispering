import type { RecorderState } from './services/MediaRecorderService';

const WHISPERING_EXTENSION_ID = 'kiiocjnndmjallnnojknfblenodpbkha';

export const sendRecorderStateToExtension = (recorderState: RecorderState) =>
	chrome.runtime.sendMessage(WHISPERING_EXTENSION_ID, { recorderState });
