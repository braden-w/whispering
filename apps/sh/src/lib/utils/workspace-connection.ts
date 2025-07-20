import type { Workspace } from '$lib/stores/workspaces.svelte';

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export type ConnectionTestResult = {
	status: ConnectionStatus;
	error?: string;
	latency?: number;
};

/**
 * Test connection to a workspace
 */
export async function testWorkspaceConnection(
	workspace: Workspace,
): Promise<ConnectionTestResult> {
	const startTime = Date.now();

	try {
		// Create basic auth header
		const auth = btoa(`${workspace.username}:${workspace.password}`);

		// Try to connect to the app endpoint
		const response = await fetch(`${workspace.url}/app`, {
			method: 'GET',
			headers: {
				Authorization: `Basic ${auth}`,
				Accept: 'application/json',
			},
			// Don't follow redirects, timeout after 5 seconds
			redirect: 'manual',
			signal: AbortSignal.timeout(5000),
		});

		if (response.ok) {
			return {
				status: 'connected',
				latency: Date.now() - startTime,
			};
		} else if (response.status === 401) {
			return {
				status: 'disconnected',
				error: 'Invalid credentials',
			};
		} else {
			return {
				status: 'disconnected',
				error: `Server returned ${response.status}`,
			};
		}
	} catch (error) {
		// Network error or timeout
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';

		return {
			status: 'disconnected',
			error: errorMessage.includes('abort')
				? 'Connection timeout'
				: errorMessage,
		};
	}
}

/**
 * Generate the shell command for setting up a workspace
 */
export function generateSetupCommand(workspace: Pick<Workspace, 'port' | 'username' | 'password'>): string {
	// Command that runs opencode serve and ngrok in one line
	return `opencode serve -p ${workspace.port} & ngrok http ${workspace.port} --basic-auth="${workspace.username}:${workspace.password}"`;
}

/**
 * Generate the individual commands for step-by-step setup
 */
export function generateSetupSteps(workspace: Pick<Workspace, 'port' | 'username' | 'password'>): { opencode: string; ngrok: string } {
	return {
		opencode: `opencode serve -p ${workspace.port}`,
		ngrok: `ngrok http ${workspace.port} --basic-auth="${workspace.username}:${workspace.password}"`,
	};
}
