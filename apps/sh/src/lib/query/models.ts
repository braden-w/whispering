import * as api from '$lib/client';
import { ShErr } from '$lib/result';
import { extractErrorMessage } from 'wellcrafted/error';
import { Ok } from 'wellcrafted/result';
import { defineQuery } from './_client';

// Query for fetching all providers and models
export const getProviders = defineQuery({
	queryKey: ['providers'],
	resultQueryFn: async () => {
		const { data, error } = await api.getConfigProviders();
		if (error) {
			return ShErr({
				title: 'Failed to fetch providers',
				description: extractErrorMessage(error),
			});
		}

		return Ok(data);
	},
});
