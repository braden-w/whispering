import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:4096';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const path = params.path;
	const queryString = url.search;

	try {
		const response = await fetch(`${BACKEND_URL}/${path}${queryString}`, {
			headers: {
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			throw error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		throw error(500, 'Failed to fetch from backend');
	}
};

export const POST: RequestHandler = async ({ params, request, fetch }) => {
	const path = params.path;

	try {
		const body = await request.json();

		const response = await fetch(`${BACKEND_URL}/${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		throw error(500, 'Failed to post to backend');
	}
};

export const PUT: RequestHandler = async ({ params, request, fetch }) => {
	const path = params.path;

	try {
		const body = await request.json();

		const response = await fetch(`${BACKEND_URL}/${path}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		throw error(500, 'Failed to update backend');
	}
};

export const DELETE: RequestHandler = async ({ params, fetch }) => {
	const path = params.path;

	try {
		const response = await fetch(`${BACKEND_URL}/${path}`, {
			method: 'DELETE',
			headers: {
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			throw error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		throw error(500, 'Failed to delete from backend');
	}
};
