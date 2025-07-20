/**
 * CORS Bypass Proxy Route
 *
 * This route acts as a proxy to bypass CORS restrictions when the SvelteKit app
 * needs to communicate with backend APIs on different origins (ports/domains).
 *
 * Why we need this:
 * The OpenCode server doesn't currently support CORS headers. When a browser
 * tries to send a request directly to the OpenCode server (e.g., from localhost:5173
 * to localhost:5000), the browser blocks it due to CORS policy. This proxy route
 * solves that by making the request server-side where CORS doesn't apply.
 *
 * How it works:
 * 1. Browser requests go to `/api/proxy/{full-target-url}`
 * 2. This proxy extracts the target URL from the path parameter
 * 3. Makes the actual request server-side (no CORS restrictions)
 * 4. Returns the response to the browser
 *
 * Example flow:
 * - Client wants: http://localhost:5000/sessions/123
 * - Browser requests: /api/proxy/http://localhost:5000/sessions/123
 * - Proxy forwards to: http://localhost:5000/sessions/123
 *
 * @see {getProxiedBaseUrl} in `/lib/client/utils/proxy-url.ts` - The client-side helper that adds the proxy prefix
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET handler - forwards GET requests to the target URL
 * Preserves query parameters from the original request
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
	const targetUrl = params.url;
	const queryString = url.search;

	try {
		// For consistency with other methods, forward headers from the request
		const headers = new Headers(request.headers);

		// Remove hop-by-hop headers
		headers.delete('host');
		headers.delete('connection');

		// Ensure Accept header for JSON response
		headers.set('Accept', 'application/json');

		const response = await fetch(`${targetUrl}${queryString}`, {
			headers,
		});

		if (!response.ok) {
			error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		error(500, `Failed to proxy GET request to ${targetUrl}`);
	}
};

/**
 * POST handler - forwards POST requests with body and headers
 *
 * Header handling rationale:
 * - We forward most headers from the original request to preserve auth tokens, etc.
 * - We remove 'host' and 'connection' headers because they're hop-by-hop headers
 *   that shouldn't be forwarded through proxies (HTTP/1.1 spec)
 * - We ensure Content-Type and Accept are set for JSON API compatibility
 */
export const POST: RequestHandler = async ({ params, request, fetch }) => {
	const targetUrl = params.url;

	try {
		const body = await request.json();
		const headers = new Headers(request.headers);

		// Remove hop-by-hop headers that shouldn't be forwarded by proxies
		headers.delete('host');
		headers.delete('connection');

		// Ensure JSON headers are set - using set() instead of passing in options
		// because we want to preserve other headers (like Authorization) from the request
		headers.set('Content-Type', 'application/json');
		headers.set('Accept', 'application/json');

		const response = await fetch(targetUrl, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		error(500, `Failed to proxy POST request to ${targetUrl}`);
	}
};

/**
 * PUT handler - forwards PUT requests with body and headers
 * Uses same header forwarding strategy as POST
 */
export const PUT: RequestHandler = async ({ params, request, fetch }) => {
	const targetUrl = params.url;

	try {
		const body = await request.json();
		const headers = new Headers(request.headers);

		// Remove hop-by-hop headers
		headers.delete('host');
		headers.delete('connection');

		// Ensure JSON headers
		headers.set('Content-Type', 'application/json');
		headers.set('Accept', 'application/json');

		const response = await fetch(targetUrl, {
			method: 'PUT',
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		error(500, `Failed to proxy PUT request to ${targetUrl}`);
	}
};

/**
 * DELETE handler - forwards DELETE requests
 * No body needed, but still forwards headers for auth
 */
export const DELETE: RequestHandler = async ({ params, request, fetch }) => {
	const targetUrl = params.url;

	try {
		const headers = new Headers(request.headers);

		// Remove hop-by-hop headers
		headers.delete('host');
		headers.delete('connection');

		// Ensure Accept header for JSON response
		headers.set('Accept', 'application/json');

		const response = await fetch(targetUrl, {
			method: 'DELETE',
			headers,
		});

		if (!response.ok) {
			error(response.status, await response.text());
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Proxy error:', err);
		error(500, `Failed to proxy DELETE request to ${targetUrl}`);
	}
};
