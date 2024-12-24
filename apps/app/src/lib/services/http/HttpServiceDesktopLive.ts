import {
	type HttpService,
	HttpServiceErr,
	tryHttpServiceAsync,
} from '$lib/services/http/HttpService';
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
			mapErr: (error) => ({
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
			mapErr: (error) => ({
				_tag: 'HttpServiceErr',
				code: 'ParseError',
				error,
			}),
		});
		return parseResult;
	},
});
