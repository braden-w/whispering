import {
	type HttpService,
	HttpServiceErr,
} from '$lib/services/http/HttpService';
import { tryAsync } from '@epicenterhq/result';
import { fetch } from '@tauri-apps/plugin-http';

export const createHttpServiceDesktopLive = (): HttpService => ({
	async post({ formData, url, schema, headers }) {
		const responseResult = await tryAsync({
			try: () =>
				fetch(url, {
					method: 'POST',
					body: formData,
					headers: { 'Content-Type': 'multipart/form-data', ...headers },
				}),
			mapErr: (error) => HttpServiceErr({ code: 'NetworkError', error }),
		});
		if (!responseResult.ok) return responseResult;

		const response = responseResult.data;
		if (!response.ok) {
			return HttpServiceErr({
				code: 'HttpError',
				status: response.status,
				error: response,
			});
		}
		const parseResult = await tryAsync({
			try: async () => {
				const json = await response.json();
				return schema.parse(json);
			},
			mapErr: (error) => HttpServiceErr({ code: 'ParseError', error }),
		});
		return parseResult;
	},
});
