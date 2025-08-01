import { type } from 'arktype';

export const Password = type('string > 0#Password');
export type Password = typeof Password.infer;

export const Port = type('1024 <= number.integer <= 65535#Port');
export type Port = typeof Port.infer;

export const URL = type('string.url#URL');
export type URL = typeof URL.infer;

// Generate an available port starting from 4096
export async function generateAvailablePort(): Promise<Port> {
	const MIN_PORT = 1024;
	const MAX_PORT = 65535;
	const PREFERRED_START = 4096;

	// First, try ports from 4096 upwards to 65535
	for (let port = PREFERRED_START; port <= MAX_PORT; port++) {
		if (await isPortAvailable(port as Port)) {
			return port as Port;
		}
	}

	// If no ports found in preferred range, try lower ports from 1024 to 4095
	for (let port = MIN_PORT; port < PREFERRED_START; port++) {
		if (await isPortAvailable(port as Port)) {
			return port as Port;
		}
	}

	// Fallback to preferred start if no ports are available (unlikely)
	return PREFERRED_START as Port;
}

// Check if a port is available by attempting to connect to it
async function isPortAvailable(port: Port): Promise<boolean> {
	try {
		// Try to fetch from localhost on the given port
		// If it fails with network error, the port is likely available
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

		await fetch(`http://localhost:${port}`, {
			mode: 'no-cors', // Avoid CORS issues
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		// If we get here, something is running on this port
		return false;
	} catch (error) {
		// Network error means port is likely available
		return true;
	}
}
