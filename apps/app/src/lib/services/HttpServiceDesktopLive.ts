import {
	type HttpService,
	HttpServiceErr,
	tryHttpServiceAsync,
} from '$lib/services/HttpService';
import { fetch } from '@tauri-apps/plugin-http';

export const createHttpServiceDesktopLive = (): HttpService => ({
	async post({ formData, url, schema, headers }) {
		const responseResult = await tryHttpServiceAsync({
			try: () =>
				fetch(url, {
					method: 'POST',
					body: formData,
					headers: { 'Content-Type': 'multipart/form-data', ...headers },
				}),
			catch: (error) => ({
				_tag: 'HttpServiceErr',
				enum: 'NetworkError',
				error,
			}),
		});
		if (!responseResult.ok) return responseResult;

		const response = responseResult.data;
		if (!response.ok) {
			return HttpServiceErr({
				_tag: 'HttpServiceErr',
				enum: 'HttpError',
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
				enum: 'ParseError',
				error,
			}),
		});
		return parseResult;
	},
});
