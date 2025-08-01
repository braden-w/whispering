import type { BetterFetchResponse } from 'better-auth/client';

import { authClient } from '$lib/auth-client';
import { ShErr } from '$lib/result';
import { APPS } from '@repo/constants/vite';
import { Err, Ok } from 'wellcrafted/result';

import { defineMutation, defineQuery, queryClient } from './_client';

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
			callbackURL: `${APPS.SH.URL}/assistants`,
			provider: 'github',
		});
		if (error) return AuthToShErr(error);
		return Ok(data);
	},
	onSuccess: () => {
		queryClient.invalidateQueries({
			queryKey: ['auth', 'getSession'],
		});
	},
});

export const signOut = defineMutation({
	mutationKey: ['auth', 'signOut'] as const,
	resultMutationFn: async () => {
		const { error } = await authClient.signOut();
		if (error) return AuthToShErr(error);
		return Ok(null);
	},
	onSuccess: () => {
		queryClient.invalidateQueries({
			queryKey: ['auth', 'getSession'],
		});
	},
});
