import type { HttpService } from '$lib/services/HttpService';
import { tryAsyncWhispering, WhisperingErr } from '@repo/shared';
import { fetch } from '@tauri-apps/plugin-http';

export const createHttpServiceDesktopLive = (): HttpService => ({
	async post({ formData, url, schema, headers }) {
		const responseResult = await tryAsyncWhispering({
			try: () =>
				fetch(url, {
					method: 'POST',
					body: formData,
					headers: { 'Content-Type': 'multipart/form-data', ...headers },
				}),
			catch: (error) =>
				({
					_tag: 'WhisperingError',
					title: '🌐 Network Hiccup!',
					description:
						error instanceof Error
							? `Oops! The internet gremlins are at it again: ${error.message}`
							: 'The internet seems to be playing hide and seek. Please try again later!',
					action: { type: 'more-details', error },
				}) as const,
		});
		if (!responseResult.ok) return responseResult;

		const response = responseResult.data;
		if (!response.ok) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: '🚫 Request Hit a Snag',
				description: `Houston, we have a problem! The server responded with status ${response.status}. Let's try that again, shall we?`,
				action: { type: 'more-details', error: response },
			} as const);
		}
		const parseResult = await tryAsyncWhispering({
			try: async () => {
				const json = await response.json();
				return schema.parse(json);
			},
			catch: (error) =>
				({
					_tag: 'WhisperingError',
					title: '🤔 Data Puzzle',
					description:
						error instanceof Error
							? `Looks like we got some unexpected data: ${error.message}`
							: 'The data we received is not quite what we expected. Mind trying again?',
					action: { type: 'more-details', error },
				}) as const,
		});
		return parseResult;
	},
});
