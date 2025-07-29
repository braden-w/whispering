import { Ok, Err, trySync, tryAsync } from 'wellcrafted/result';
import type { TunnelService, TunnelProcess } from './types';
import { TunnelServiceErr } from './types';
import { spawn } from 'bun';
import type { Subprocess } from 'bun';

export function createTunnelServiceNgrok(): TunnelService {
	let currentTunnelProcess: TunnelProcess | null = null;

	return {
		async ensureInstalled() {
			const { data, error } = await tryAsync({
				try: async () => {
					const proc = spawn(['ngrok', 'version'], {
						stdin: 'ignore',
						stdout: 'ignore',
						stderr: 'ignore',
					});
					await proc.exited;
					return proc;
				},
				mapErr: (error) =>
					TunnelServiceErr({
						message: `ngrok is not installed.\n\n${getInstallInstructions()}`,
						cause: error,
					}),
			});

			if (error) return Err(error);

			if (data.exitCode !== 0) {
				return TunnelServiceErr({
					message: `ngrok is not installed.\n\n${getInstallInstructions()}`,
					cause: data.exitCode,
				});
			}
			return Ok(undefined);
		},

		async startTunnel(port: number) {
			// Stop any existing tunnel before starting a new one
			if (currentTunnelProcess) {
				this.stopTunnel();
			}

			const tunnelProc = spawn(
				['ngrok', 'http', '--log=stdout', '--log-format=json', port.toString()],
				{
					stdin: 'ignore',
					stdout: 'pipe',
					stderr: 'pipe',
					onExit(_proc, exitCode, signalCode, error) {
						if (error) {
							console.error('Tunnel process error:', error.message);
						}
					},
				},
			);

			currentTunnelProcess = { process: tunnelProc, url: null };

			return new Promise(async (resolve) => {
				try {
					// Read stdout for JSON messages
					for await (const chunk of tunnelProc.stdout as any) {
						const data = new TextDecoder().decode(chunk);
						const lines = data.split('\n').filter((line) => line.trim());

						for (const line of lines) {
							try {
								const json = JSON.parse(line);

								// Found the tunnel URL
								if (json.msg === 'started tunnel' && json.url && currentTunnelProcess) {
									currentTunnelProcess.url = json.url;
									resolve(Ok(currentTunnelProcess));
									return;
								}

								// Check for errors
								if (json.err && json.err !== '<nil>') {
									resolve(
										TunnelServiceErr({
											message: `Failed to start ngrok tunnel on port ${port}: ${json.err}`,
										}),
									);
									return;
								}
							} catch (e) {
								// Not JSON, ignore
							}
						}
					}

					// If we get here, process ended without URL
					const exitCode = await tunnelProc.exited;
					resolve(
						TunnelServiceErr({
							message: `ngrok process ended without providing URL (exit code: ${exitCode})`,
						}),
					);
				} catch (error) {
					resolve(
						TunnelServiceErr({
							message: `Tunnel start error: ${
								error instanceof Error ? error.message : String(error)
							}`,
							cause: error,
						}),
					);
				}
			});
		},

		stopTunnel() {
			return trySync({
				try: () => {
					if (currentTunnelProcess?.process && !currentTunnelProcess.process.killed) {
						currentTunnelProcess.process.kill('SIGTERM');
						currentTunnelProcess = null;
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
