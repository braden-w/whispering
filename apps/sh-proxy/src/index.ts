import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS configuration
const corsOptions = {
	origin: '*',
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['*'],
	credentials: true,
};

// Apply CORS to all routes
app.use('*', cors(corsOptions));

// Helper function to parse authentication from URL
function parseAuthFromUrl(urlString: string): {
	cleanUrl: string;
	auth?: string;
} {
	try {
		const url = new URL(urlString);
		const auth =
			url.username && url.password ? `${url.username}:${url.password}` : null;

		// Remove auth from URL
		url.username = '';
		url.password = '';

		return {
			cleanUrl: url.toString(),
			auth: auth || undefined,
		};
	} catch {
		return { cleanUrl: urlString };
	}
}

// Helper function to reconstruct target URL from path parameters
function reconstructTargetUrl(
	protocol: string,
	host: string,
	pathname: string,
): string {
	// Handle auth in host (e.g., user:pass@hostname)
	const baseUrl = `${protocol}://${host}`;
	const fullUrl = pathname ? `${baseUrl}/${pathname}` : baseUrl;
	return fullUrl;
}

// Helper to add CORS headers to response
function addCorsHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS',
	);
	headers.set('Access-Control-Allow-Headers', '*');
	headers.set('Access-Control-Allow-Credentials', 'true');
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

// Main proxy handler
async function proxyHandler(c: any) {
	const protocol = c.req.param('protocol');
	const host = c.req.param('host');
	const pathname = c.req.param('*') || '';

	if (!protocol || !host) {
		return c.json({ error: 'Invalid proxy URL format' }, 400);
	}

	// Reconstruct the target URL
	const targetUrl = reconstructTargetUrl(protocol, host, pathname);

	// Parse auth from URL if present
	const { cleanUrl, auth } = parseAuthFromUrl(targetUrl);

	// Build headers for the proxied request
	const headers = new Headers();

	// Forward most headers from the original request
	for (const [key, value] of c.req.header()) {
		// Skip host header and other hop-by-hop headers
		if (
			![
				'host',
				'connection',
				'keep-alive',
				'transfer-encoding',
				'upgrade',
			].includes(key.toLowerCase())
		) {
			headers.set(key, value);
		}
	}

	// Add Basic Auth header if auth was in URL
	if (auth) {
		headers.set('Authorization', `Basic ${btoa(auth)}`);
	}

	// Detect if this is an SSE request
	const acceptHeader = c.req.header('Accept') || '';
	const isSSE =
		pathname.endsWith('/event') || acceptHeader.includes('text/event-stream');

	try {
		if (isSSE) {
			// Handle Server-Sent Events
			return handleSSE(c, cleanUrl, headers);
		} else {
			// Handle regular HTTP requests
			return handleRegularRequest(c, cleanUrl, headers);
		}
	} catch (error: any) {
		console.error('Proxy error:', error);
		return c.json(
			{
				error: 'Proxy request failed',
				details: error.message,
			},
			500,
		);
	}
}

// Handle regular HTTP requests
async function handleRegularRequest(
	c: any,
	targetUrl: string,
	headers: Headers,
) {
	// Get request body if present
	let body = null;
	const method = c.req.method;

	if (['POST', 'PUT', 'PATCH'].includes(method)) {
		const contentType = c.req.header('Content-Type') || '';
		if (contentType.includes('application/json')) {
			body = await c.req.json();
		} else {
			body = await c.req.text();
		}
	}

	// Make the proxied request with timeout
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

	try {
		const response = await fetch(targetUrl, {
			method: method,
			headers: headers,
			body: body ? JSON.stringify(body) : undefined,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		// Forward the response
		const responseHeaders = new Headers(response.headers);

		// Ensure CORS headers are set
		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, OPTIONS',
		);
		responseHeaders.set('Access-Control-Allow-Headers', '*');
		responseHeaders.set('Access-Control-Allow-Credentials', 'true');

		// Handle different response types
		const contentType = response.headers.get('Content-Type') || '';

		if (contentType.includes('application/json')) {
			const data = await response.json();
			return c.json(data, response.status, Object.fromEntries(responseHeaders));
		} else {
			const data = await response.text();
			return new Response(data, {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
			});
		}
	} catch (error: any) {
		clearTimeout(timeoutId);

		if (error.name === 'AbortError') {
			return c.json({ error: 'Request timeout' }, 504);
		}

		throw error;
	}
}

// Handle Server-Sent Events
async function handleSSE(c: any, targetUrl: string, headers: Headers) {
	// Set SSE-specific headers
	headers.set('Accept', 'text/event-stream');
	headers.set('Cache-Control', 'no-cache');

	// Create a TransformStream for SSE
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();
	const encoder = new TextEncoder();

	// Start the SSE stream
	const sseHeaders = new Headers({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
		'X-Accel-Buffering': 'no',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Credentials': 'true',
	});

	// Fetch the SSE stream
	fetch(targetUrl, {
		method: 'GET',
		headers: headers,
	})
		.then(async (response) => {
			if (!response.ok) {
				await writer.write(
					encoder.encode(
						`data: {"error": "Failed to connect to SSE endpoint", "status": ${response.status}}\n\n`,
					),
				);
				await writer.close();
				return;
			}

			const reader = response.body?.getReader();
			if (!reader) {
				await writer.write(
					encoder.encode('data: {"error": "No response body"}\n\n'),
				);
				await writer.close();
				return;
			}

			const decoder = new TextDecoder();
			let buffer = '';

			try {
				while (true) {
					const { done, value } = await reader.read();

					if (done) break;

					// Decode the chunk and add to buffer
					buffer += decoder.decode(value, { stream: true });

					// Process complete events (ending with \n\n)
					const events = buffer.split('\n\n');

					// Keep the last incomplete event in the buffer
					buffer = events.pop() || '';

					// Write complete events
					for (const event of events) {
						if (event.trim()) {
							// Ensure proper SSE format
							if (event.startsWith('data:')) {
								await writer.write(encoder.encode(event + '\n\n'));
							} else {
								// Wrap in data: format if not already
								await writer.write(encoder.encode(`data: ${event}\n\n`));
							}
						}
					}
				}
			} catch (error) {
				console.error('SSE stream error:', error);
				await writer.write(
					encoder.encode(
						`data: {"error": "Stream error", "message": "${error}"}\n\n`,
					),
				);
			} finally {
				await writer.close();
			}
		})
		.catch(async (error) => {
			await writer.write(
				encoder.encode(
					`data: {"error": "Connection failed", "message": "${error.message}"}\n\n`,
				),
			);
			await writer.close();
		});

	return new Response(readable, {
		headers: sseHeaders,
	});
}

// Health check endpoint
app.get('/', (c) => {
	return c.json({
		service: 'OpenCode Proxy',
		version: '1.0.0',
		status: 'healthy',
		endpoints: {
			proxy: '/proxy/:protocol/:host/*path',
			examples: [
				'/proxy/https/api.example.com/v1/users',
				'/proxy/https/user:pass@secure.example.com/data',
				'/proxy/http/localhost:4096/event',
			],
		},
	});
});

// OPTIONS handler for preflight requests
app.options('*', (c) => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Max-Age': '86400',
		},
	});
});

// Main proxy routes
app.all('/proxy/:protocol/:host', proxyHandler);
app.all('/proxy/:protocol/:host/*', proxyHandler);

// 404 handler
app.notFound((c) => {
	return c.json(
		{
			error: 'Not found',
			message: 'Use /proxy/:protocol/:host/* to proxy requests',
		},
		404,
	);
});

// Error handler
app.onError((err, c) => {
	console.error('Application error:', err);
	return c.json(
		{
			error: 'Internal server error',
			message: err.message,
		},
		500,
	);
});

export default app;
