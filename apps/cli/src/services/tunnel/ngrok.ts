import { Ok, Err, trySync, tryAsync } from 'wellcrafted/result';
import type { TunnelService } from './types';
import { TunnelServiceErr } from './types';
import { spawn, $ } from 'bun';
import { type } from 'arktype';
import type { Subprocess } from 'bun';

export function createTunnelServiceNgrok(): TunnelService {
	let currentProcess: Subprocess | null = null;

	return {
		async ensureInstalled() {
			const { error } = await tryAsync({
				try: async () => {
					await $`ngrok version`.quiet();
				},
				mapErr: (error) =>
					TunnelServiceErr({
						message: `ngrok is not installed.\n\n${getInstallInstructions()}`,
						cause: error,
					}),
			});

			if (error) return Err(error);
			return Ok(undefined);
		},

		async startTunnel(port: number) {
			// Stop any existing tunnel before starting a new one
			if (currentProcess) this.stopTunnel();

			return tryAsync({
				try: async () => {
					const tunnelProc = spawn(
						[
							'ngrok',
							'http',
							'--log=stdout',
							'--log-format=json',
							port.toString(),
						],
						{
							stdin: 'ignore',
							stdout: 'pipe',
							stderr: 'pipe',
						},
					);

					currentProcess = tunnelProc;

					// Read stdout for JSON messages
					const decoder = new TextDecoder();
					let tunnelUrl: string | null = null;

					// Continue reading stdout in background to keep the process alive
					// This prevents the stdout buffer from filling up and blocking ngrok
					(async () => {
						for await (const chunk of tunnelProc.stdout as any) {
							const data = decoder.decode(chunk);
							const lines = data.split('\n').filter((line) => line.trim());

							for (const line of lines) {
								const json = type('string.json.parse').to({
									'msg?': 'string',
									'url?': 'string',
									'err?': 'string',
								})(line);

								if (json instanceof type.errors) continue;

								// Store the tunnel URL when found
								if (json.msg === 'started tunnel' && json.url && !tunnelUrl) {
									tunnelUrl = json.url;
								}

								// Log errors but don't throw (keep reading)
								if (json.err && json.err !== '<nil>') {
									console.error(`ngrok error: ${json.err}`);
								}
							}
						}
					})();

					// Wait for the tunnel URL to be found
					const maxWaitTime = 30000; // 30 seconds
					const pollInterval = 100; // 100ms
					const startTime = Date.now();

					while (!tunnelUrl) {
						await new Promise((resolve) => setTimeout(resolve, pollInterval));

						if (Date.now() - startTime > maxWaitTime) {
							throw new Error('Timeout waiting for ngrok tunnel URL');
						}

						// Check if process has exited
						if (tunnelProc.killed) {
							const exitCode = await tunnelProc.exited;
							throw new Error(
								`ngrok process ended without providing URL${
									exitCode !== 0 ? ` (exit code: ${exitCode})` : ''
								}`,
							);
						}
					}

					return tunnelUrl;
				},
				mapErr: (error) =>
					TunnelServiceErr({
						message: `Failed to start ngrok tunnel on port ${port}: ${
							error instanceof Error ? error.message : String(error)
						}`,
						cause: error,
					}),
			});
		},

		stopTunnel() {
			return trySync({
				try: () => {
					if (currentProcess && !currentProcess.killed) {
						currentProcess.kill('SIGTERM');
						currentProcess = null;
					}
				},
				mapErr: (error) =>
					TunnelServiceErr({
						message: `Failed to stop tunnel: ${error instanceof Error ? error.message : String(error)}`,
						cause: error,
					}),
			});
		},
	};
}

function getInstallInstructions(): string {
	const platform = process.platform;

	switch (platform) {
		case 'darwin':
			return (
				'Install ngrok:\n' +
				'  # Homebrew: brew install ngrok\n' +
				'  # MacPorts: sudo port install ngrok\n' +
				'  # Manual: Download from https://ngrok.com/download'
			);
		case 'linux':
			return (
				'Install ngrok:\n' +
				'  # Snap: sudo snap install ngrok\n' +
				'  # APT (Debian/Ubuntu):\n' +
				'  curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null\n' +
				'  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list\n' +
				'  sudo apt update && sudo apt install ngrok\n' +
				'  \n' +
				'  # Manual: Download from https://ngrok.com/download'
			);
		case 'win32':
			return (
				'Install ngrok:\n' +
				'  # Chocolatey: choco install ngrok\n' +
				'  # Scoop: scoop install ngrok\n' +
				'  # Manual: Download from https://ngrok.com/download'
			);
		default:
			return 'Install ngrok: https://ngrok.com/download';
	}
}
