import type { HttpService } from '$lib/services/HttpService';
import { BubbleErr, tryAsyncBubble } from '@repo/shared';
import { fetch } from '@tauri-apps/plugin-http';

export const createHttpServiceDesktopLive = (): HttpService => ({
	async post({ formData, url, schema, headers }) {
		const responseResult = await tryAsyncBubble({
			try: () =>
				fetch(url, {
					method: 'POST',
					body: formData,
					headers: { 'Content-Type': 'multipart/form-data', ...headers },
				}),
			catch: (error) =>
				({
					_tag: 'NetworkError',
					message:
						error instanceof Error ? error.message : 'Please try again later.',
				}) as const,
		});
		if (!responseResult.ok) return responseResult;

		const response = responseResult.data;
		if (!response.ok) {
			return BubbleErr({
				_tag: 'HttpError',
				message: `Request failed with status ${response.status}.`,
			} as const);
		}
		const parseResult = await tryAsyncBubble({
			try: async () => {
				const json = await response.json();
				return schema.parse(json);
			},
			catch: (error) =>
				({
					_tag: 'ParseError',
					message:
						error instanceof Error ? error.message : 'Please try again later.',
				}) as const,
		});
		return parseResult;
	},
});
