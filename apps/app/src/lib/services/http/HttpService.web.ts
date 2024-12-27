import { tryAsync } from '@epicenterhq/result';
import type { HttpService } from './HttpService';
import { HttpServiceErr } from './HttpService';

export function createHttpServiceWeb(): HttpService {
	return {
		async post({ formData, url, schema, headers }) {
			const responseResult = await tryAsync({
				try: () =>
					window.fetch(url, {
						method: 'POST',
						body: formData,
						headers,
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
	};
}
