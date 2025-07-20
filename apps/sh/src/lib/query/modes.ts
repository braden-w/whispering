import * as api from '$lib/client';
import type { Mode } from '$lib/client/types.gen';
import { Ok } from 'wellcrafted/result';
import { defineQuery } from './_client';

const initialModes: Mode[] = [
	{
		name: 'build',
		tools: {}
	},
	{
		name: 'plan',
		tools: {
			write: false,
			edit: false,
			patch: false
		}
	}
];

export const modes = {
	getModes: defineQuery({
		queryKey: ['modes'],
		resultQueryFn: async () => {
			const response = await api.getMode();
			return Ok(response.data ?? initialModes);
		},
		initialData: initialModes
	})
};