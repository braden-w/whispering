import type { TaggedError } from 'wellcrafted/error';
import { Err, type Ok } from 'wellcrafted/result';

export type ShError = {
	name: 'ShError';
	title: string;
	description: string;
};

const ShError = (args: Omit<ShError, 'name'>): ShError => ({
	name: 'ShError',
	...args,
});

export const ShErr = (args: Omit<ShError, 'name'>) => Err(ShError(args));

export type ShResult<T> = Ok<T> | Err<ShError>;

export const fromTaggedError = (
	error: TaggedError<string>,
	opts: Omit<Parameters<typeof ShError>[0], 'description'>,
): ShError => ShError({ ...opts, description: error.message });

export const fromTaggedErr = (
	error: TaggedError<string>,
	opts: Omit<Parameters<typeof ShError>[0], 'description'>,
) => Err(fromTaggedError(error, opts));
