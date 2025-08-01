// ==============================================================================
//           Cloudflare Tunnel Provisioning Script (JavaScript/Fetch)
//
// This script programmatically creates and configures a Cloudflare Tunnel
// using the Fetch API. It provides a single command-line token for the user
// to run, eliminating the need for a separate credentials file.
//
// Environment:
//   - This script is designed for a secure backend environment like Node.js,
//     Deno, or a serverless function (e.g., Cloudflare Workers).
//   - DO NOT run this in a public-facing browser environment, as it would
//     expose your secret API token.
//
// ==============================================================================

// --- CONFIGURABLE VARIABLES ---
// In a real application, these should be stored securely as environment variables
// and not hardcoded in the script.
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const YOUR_DOMAIN = 'epicenter.sh';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';

/**
 * A helper function to handle API requests and error checking.
 * @param {string} endpoint - The API endpoint to call.
 * @param {object} options - The options object for the fetch call.
 * @returns {Promise<object>} - The JSON result from the API.
 */
async function apiRequest(endpoint, options = {}) {
	const url = `${API_BASE_URL}${endpoint}`;
	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	const data = await response.json();

	if (!data.success) {
		// Throw an error to be caught by the main function's catch block.
		throw new Error(`Cloudflare API Error: ${JSON.stringify(data.errors)}`);
	}

	return data.result;
}

// --- EXAMPLE USAGE ---
// This is how you would call the function from your backend code.
async function main() {
	// Get user input from command line arguments or an API request body
	const args = process.argv.slice(2);
	if (args.length !== 2) {
		console.log(
			'Usage: node provision_tunnel.js <user_subdomain> <user_local_port>',
		);
		console.log('Example: node provision_tunnel.js user-john-smith 8080');
		return;
	}

	const userSubdomain = args[0];
	const userPort = Number.parseInt(args[1], 10);

	try {
		const result = await provisionTunnel(userSubdomain, userPort);

		console.log('\n🎉 Provisioning Complete! 🎉');
		console.log(
			'==============================================================================',
		);
		console.log(`Public URL: ${result.finalUrl}`);
		console.log(
			'\nTo give this to your user, provide them with the following single command',
		);
		console.log('to run on their machine:\n');
		console.log(`   ${result.runCommand}`);
		console.log(
			'\n==============================================================================',
		);
	} catch (error) {
		console.error(
			'\nProvisioning failed. Please check the error messages above.',
		);
	}
}

/**
 * Provisions a new Cloudflare Tunnel for a user.
 * @param {string} userSubdomain - A unique name for the user's subdomain.
 * @param {number} userPort - The local port on the user's machine to expose.
 * @returns {Promise<{finalUrl: string, runCommand: string}>} - An object with the public URL and the command for the user.
 */
async function provisionTunnel(userSubdomain, userPort) {
	const tunnelName = `${userSubdomain}-tunnel`;
	const finalUrl = `https://${userSubdomain}.${YOUR_DOMAIN}`;
	console.log(`🚀 Starting provisioning for ${finalUrl}...`);

	let tunnelId = null;
	let dnsRecordId = null;

	try {
		// --- STEP 1: CREATE THE TUNNEL ---
		console.log(`   [1/5] Creating tunnel: ${tunnelName}...`);
		const createTunnelResult = await apiRequest(
			`/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel`,
			{
				body: JSON.stringify({ name: tunnelName }),
				method: 'POST',
			},
		);
		tunnelId = createTunnelResult.id;
		console.log(`   ✅ Tunnel created with ID: ${tunnelId}`);

		// --- STEP 2: GET THE TUNNEL TOKEN ---
		console.log('   [2/5] Fetching tunnel token...');
		const tunnelToken = await apiRequest(
			`/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${tunnelId}/token`,
		);
		console.log('   ✅ Token fetched successfully.');

		// --- STEP 3: CREATE DNS CNAME RECORD ---
		console.log(
			`   [3/5] Creating DNS CNAME record for ${userSubdomain}.${YOUR_DOMAIN}...`,
		);
		const createDnsResult = await apiRequest(
			`/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
			{
				body: JSON.stringify({
					comment: `Tunnel for ${tunnelName}`,
					content: `${tunnelId}.cfargotunnel.com`,
					name: userSubdomain,
					proxied: true,
					type: 'CNAME',
				}),
				method: 'POST',
			},
		);
		dnsRecordId = createDnsResult.id;
		console.log('   ✅ DNS record created.');

		// --- STEP 4: CONFIGURE TUNNEL INGRESS RULES ---
		console.log(
			`   [4/5] Configuring tunnel to route traffic to localhost:${userPort}...`,
		);
		const ingressConfig = {
			ingress: [
				{
					hostname: `${userSubdomain}.${YOUR_DOMAIN}`,
					service: `http://localhost:${userPort}`,
				},
				{ service: 'http_status:404' }, // Catch-all rule
			],
		};
		await apiRequest(
			`/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${tunnelId}/configurations`,
			{
				body: JSON.stringify({ config: ingressConfig }),
				method: 'PUT',
			},
		);
		console.log('   ✅ Tunnel configured successfully.');

		// --- STEP 5: RETURN THE FINAL COMMAND ---
		console.log('   [5/5] Generating final command for the user...');
		const runCommand = `cloudflared tunnel --no-autoupdate run --token ${tunnelToken}`;

		return { finalUrl, runCommand };
	} catch (error) {
		console.error('❌ An error occurred during provisioning:', error.message);

		// --- CLEANUP ON FAILURE ---
		console.log('   🧹 Attempting to clean up created resources...');
		if (dnsRecordId) {
			try {
				await apiRequest(
					`/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${dnsRecordId}`,
					{ method: 'DELETE' },
				);
				console.log('   🧹 Cleaned up DNS record.');
			} catch (cleanupError) {
				console.error(
					'   - Failed to clean up DNS record:',
					cleanupError.message,
				);
			}
		}
		if (tunnelId) {
			try {
				await apiRequest(
					`/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${tunnelId}`,
					{ method: 'DELETE' },
				);
				console.log('   🧹 Cleaned up tunnel.');
			} catch (cleanupError) {
				console.error('   - Failed to clean up tunnel:', cleanupError.message);
			}
		}
		// Re-throw the original error to signal failure to the caller
		throw error;
	}
}

// Run the main function
main();
