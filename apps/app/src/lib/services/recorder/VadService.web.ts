import { Ok, trySync } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import { MicVAD } from '@ricky0123/vad-web';

export function createVadServiceWeb() {
	let maybeVad: MicVAD | null = null;
	const blobQueue: Blob[] = [];

	return {
		ensureVad: async () => {
			if (maybeVad) return Ok(maybeVad);
			maybeVad = await MicVAD.new({
				onSpeechStart: () => {
					console.log('Speech started');
				},
				onSpeechEnd: (audio) => {
					console.log('Speech ended');
					const blob = new Blob([audio], {
						type: 'audio/wav',
					});
					blobQueue.push(blob);
				},
				onVADMisfire: () => {
					console.log('VAD misfire');
				},
			});
			return Ok(maybeVad);
		},
		closeVad: async () => {
			if (!maybeVad) return Ok(undefined);
			const vad = maybeVad;
			const destroyResult = trySync({
				try: () => vad.destroy(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to destroy Voice Activity Detector',
						description:
							error instanceof Error ? error.message : 'Failed to destroy VAD',
					}),
			});
			if (!destroyResult.ok) return destroyResult;
			maybeVad = null;
			return Ok(undefined);
		},
		startVad: async () => {
			if (!maybeVad)
				return WhisperingErr({
					title: 'Voice Activity Detector not initialized',
					description:
						'The voice activity detector has not been initialized. Please ensure that the VAD is initialized before starting it.',
				});
			const vad = maybeVad;
			const startResult = trySync({
				try: () => vad.start(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to start Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while starting the VAD.',
					}),
			});
			return startResult;
		},
		pauseVad: async () => {
			if (!maybeVad)
				return WhisperingErr({
					title: 'Voice Activity Detector not initialized',
					description: 'VAD not initialized',
				});
			const vad = maybeVad;
			const pauseResult = trySync({
				try: () => vad.pause(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to pause Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while pausing the VAD.',
					}),
			});
			return pauseResult;
		},
		destroyVad: async () => {
			if (!maybeVad)
				return WhisperingErr({
					title: 'Voice Activity Detector not initialized',
					description: 'VAD not initialized',
				});
			const vad = maybeVad;
			const destroyResult = trySync({
				try: () => vad.destroy(),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Failed to destroy Voice Activity Detector',
						description:
							error instanceof Error
								? error.message
								: 'An unknown error occurred while destroying the VAD.',
					}),
			});
			if (!destroyResult.ok) return destroyResult;
			maybeVad = null;
		},
	};
}
