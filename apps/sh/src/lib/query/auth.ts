import { authClient } from '$lib/auth-client';
import { APPS } from '@repo/constants';
import { Err, Ok } from 'wellcrafted/result';

import { defineMutation, defineQuery } from './_client';
import { ShErr } from '$lib/result';
import type { BetterFetchResponse } from 'better-auth/client';

function AuthToShErr<
	T extends BetterFetchResponse<unknown, unknown, false>['error'],
>(error: NonNullable<T>) {
	return ShErr({
		title: 'Failed to get session',
		description:
			error.message ??
			error.statusText ??
			(error ? `Error ${error.status}` : 'An unknown error occurred'),
	});
}

export const getSession = defineQuery({
	queryKey: ['auth', 'getSession'] as const,
	resultQueryFn: async () => {
		const { data, error } = await authClient.getSession();
		if (error) return AuthToShErr(error);
		return Ok(data);
	},
	select: (data) => data?.session ?? null,
});

export const getUser = defineQuery({
	queryKey: ['auth', 'getSession'] as const,
	resultQueryFn: async () => {
		const { data, error } = await authClient.getSession();
		if (error) return AuthToShErr(error);
		return Ok(data);
	},
	select: (data) => data?.user ?? null,
});

export const signInWithGithub = defineMutation({
	mutationKey: ['auth', 'signInWithGithub'] as const,
	resultMutationFn: async () => {
		const { data, error } = await authClient.signIn.social({
			callbackURL: `${APPS(import.meta.env).SH.URL}/assistants`,
			provider: 'github',
		});
		if (error) return AuthToShErr(error);
		return Ok(data);
	},
});

export const signOut = defineMutation({
	mutationKey: ['auth', 'signOut'] as const,
	resultMutationFn: async () => {
		const { error } = await authClient.signOut();
		if (error) return AuthToShErr(error);
		return Ok(null);
	},
});
