import * as rpc from '$lib/query';
import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { data: assistantConfig, error: configError } =
		await rpc.assistantConfigs.getAssistantConfigById(() => params.id).ensure();

	if (configError || !assistantConfig) redirect(302, '/assistants');

	const { data: sessions, error } = await rpc.sessions
		.getSessions(() => assistantConfig)
		.ensure();

	if (error) redirect(302, '/assistants');

	return { assistantConfig, sessions };
};
