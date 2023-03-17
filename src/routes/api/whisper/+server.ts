import { error, text } from '@sveltejs/kit';
import type { RequestHandler } from '../../whisper/$types';
import { sendAudioToWhisper } from '$lib/whisper';

export const POST = (async ({ request }) => {
	try {
		const wavBlob = new Blob([new Uint8Array(await request.arrayBuffer())], {
			type: 'audio/wav'
		});
		const whisperText = await sendAudioToWhisper(wavBlob);
		return text(whisperText);
	} catch (err) {
		if (err instanceof Error) throw error(500, `Error processing audio: ${err.message}`);
	}
	throw error(500, 'Error processing audio');
}) satisfies RequestHandler;
