import { getTranscriptionFromWhisperAPI } from '../whisperTranscription';

export const onRequestPost: PagesFunction = async ({ request }) => {
	try {
		const WHISPER_API_KEY = request.headers.get('x-whisper-api-key');
		if (!WHISPER_API_KEY) return new Response('Missing x-whisper-api-key header', { status: 400 });
		const wavBlob = new Blob([new Uint8Array(await request.arrayBuffer())]);
		const whisperText = await getTranscriptionFromWhisperAPI(wavBlob, WHISPER_API_KEY);
		return new Response(whisperText, {
			status: 200,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	} catch (err) {
		return new Response(`Error processing audio: ${err.message}`, { status: 500 });
	}
};
