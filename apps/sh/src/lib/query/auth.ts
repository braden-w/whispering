import { authClient } from '$lib/auth-client';
import { Err, Ok } from 'wellcrafted/result';
import { defineMutation, defineQuery } from './_client';
import { APPS } from '@repo/constants';

export const getSession = defineQuery({
	queryKey: ['auth', 'getSession'] as const,
	resultQueryFn: async () => {
		const { data, error } = await authClient.getSession();
		if (error) return Err(error);
		return Ok(data);
	},
	select: (data) => data?.session ?? null,
});

export const getUser = defineQuery({
	queryKey: ['auth', 'getSession'] as const,
	resultQueryFn: async () => {
		const { data, error } = await authClient.getSession();
		if (error) return Err(error);
		return Ok(data);
	},
	select: (data) => data?.user ?? null,
});

export const signInWithGithub = defineMutation({
	mutationKey: ['auth', 'signInWithGithub'] as const,
	resultMutationFn: async () => {
		const { data, error } = await authClient.signIn.social({
			provider: 'github',
			callbackURL: `${APPS(import.meta.env).SH.URL}/workspaces`,
		});
		if (error) return Err(error);
		return Ok(data);
	},
});

export const signOut = defineMutation({
	mutationKey: ['auth', 'signOut'] as const,
	resultMutationFn: async () => {
		const { error } = await authClient.signOut();
		if (error) return Err(error);
		return Ok(null);
	},
});
