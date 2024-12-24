import { trySync } from '@epicenterhq/result';

export const parseJson = (value: string) =>
	trySync({
		try: () => JSON.parse(value) as unknown,
		catch: (error) => ({ _tag: 'ParseJsonError', error }),
	});
