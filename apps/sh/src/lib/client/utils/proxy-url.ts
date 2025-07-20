import { browser } from '$app/environment';

/**
 * Determines whether to proxy requests for CORS bypass
 * 
 * This function is part of our CORS bypass strategy. When running in the browser,
 * API requests to different origins (different ports/domains) are blocked by CORS.
 * To work around this, we route requests through our SvelteKit server proxy.
 * 
 * How it works:
 * - In browser: Prepends `/api/proxy/` to the base URL, routing through our proxy
 * - On server: Returns the URL unchanged (no CORS restrictions server-side)
 * 
 * Example:
 * - Input: `http://localhost:5000`
 * - Browser output: `/api/proxy/http://localhost:5000`
 * - Server output: `http://localhost:5000`
 * 
 * When the client makes a request to `/api/proxy/http://localhost:5000/sessions`,
 * our proxy route extracts the full URL and forwards the request server-side.
 * 
 * @param baseUrl - The target API base URL (e.g., "http://localhost:5000")
 * @returns The URL to use as baseUrl for the API client
 * 
 * @see /routes/api/proxy/[...url]/+server.ts - The proxy route that handles these requests
 */
export function getProxiedBaseUrl(baseUrl: string): string {
	if (browser) {
		// In browser, prefix with our proxy route to bypass CORS
		return `/api/proxy/${baseUrl}`;
	}
	// On server, use direct URL (no CORS restrictions)
	return baseUrl;
}