import { authClient } from '$lib/auth-client';
import { Err, Ok } from 'wellcrafted/result';
import { defineMutation } from './_client';

export const signInWithGithub = defineMutation({
	mutationKey: ['auth', 'signInWithGithub'] as const,
	resultMutationFn: async () => {
		const { data, error } = await authClient.signIn.social({
			provider: 'github',
			callbackURL: '/workspaces',
		});
		if (error) return Err(error);
		return Ok(data);
	},
});
