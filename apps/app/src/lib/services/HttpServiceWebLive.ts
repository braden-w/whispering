import type { HttpService } from '$lib/services/HttpService';
import { HttpServiceErr, tryHttpServiceAsync } from '$lib/services/HttpService';

export const createHttpServiceWebLive = (): HttpService => ({
	async post({ formData, url, schema, headers }) {
		const responseResult = await tryHttpServiceAsync({
			try: () =>
				window.fetch(url, {
					method: 'POST',
					body: formData,
					headers,
				}),
			catch: (error) => ({
				_tag: 'HttpServiceErr',
				code: 'NetworkError',
				error,
			}),
		});
		if (!responseResult.ok) return responseResult;

		const response = responseResult.data;
		if (!response.ok) {
			return HttpServiceErr({
				_tag: 'HttpServiceErr',
				code: 'HttpError',
				status: response.status,
				error: response,
			});
		}
		const parseResult = await tryHttpServiceAsync({
			try: async () => {
				const json = await response.json();
				return schema.parse(json);
			},
			catch: (error) => ({
				_tag: 'HttpServiceErr',
				code: 'ParseError',
				error,
			}),
		});
		return parseResult;
	},
});
