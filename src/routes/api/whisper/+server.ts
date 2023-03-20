import { WHISPER_API_KEY } from '$env/static/private';
import { getTranscription } from '$lib/whisper';
import { error, text } from '@sveltejs/kit';
import type { RequestHandler } from '../../whisper/$types';

export const POST = (async ({ request }) => {
	try {
		const wavBlob = new Blob([new Uint8Array(await request.arrayBuffer())], {
			type: 'audio/wav'
		});
		const whisperText = await getTranscription(wavBlob, WHISPER_API_KEY);
		return text(whisperText);
	} catch (err) {
		if (err instanceof Error) throw error(500, `Error processing audio: ${err.message}`);
	}
	throw error(500, 'Error processing audio');
}) satisfies RequestHandler;
