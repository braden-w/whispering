import { Ok, Err, trySync, tryAsync } from 'wellcrafted/result';
import type { TunnelService, TunnelProcess } from './types';
import { TunnelServiceErr } from './types';
import { spawn, $ } from 'bun';
import { extractErrorMessage } from 'wellcrafted/error';

export function createTunnelServiceCloudflare(): TunnelService {
	let currentTunnelProcess: TunnelProcess | null = null;

	return {
		async ensureInstalled() {
			const { error } = await tryAsync({
				try: async () => {
					await $`cloudflared --version`.quiet();
				},
				mapErr: (error) => {
					return TunnelServiceErr({
						message: `cloudflared is not installed.\n\n${getInstallInstructions()}`,
						cause: error,
					});
				},
			});

			if (error) return Err(error);
			return Ok(undefined);
		},

		async startTunnel(port: number) {
			// Stop any existing tunnel before starting a new one
			if (currentTunnelProcess) {
				this.stopTunnel();
			}

			return tryAsync({
				try: async () => {
					const tunnelProc = spawn(
						['cloudflared', 'tunnel', '--url', `http://localhost:${port}`],
						{
							stdin: 'ignore',
							stdout: 'ignore',
							stderr: 'pipe',
						},
					);

					currentTunnelProcess = { process: tunnelProc, url: null };

					// Read from stderr stream to parse tunnel URL
					const decoder = new TextDecoder();
					for await (const chunk of tunnelProc.stderr as any) {
						const data = decoder.decode(chunk);
						
						// Parse the tunnel URL from the box format
						const urlMatch = data.match(
							/\|\s+(https:\/\/[^|]+\.trycloudflare\.com)\s+\|/,
						);
						
						if (urlMatch?.[1]) {
							const url = urlMatch[1].trim();
							if (currentTunnelProcess) {
								currentTunnelProcess.url = url;
								return currentTunnelProcess;
							}
						}
					}

					// Stream ended without finding URL
					const exitCode = await tunnelProc.exited;
					throw new Error(
						`Failed to start cloudflared tunnel on port ${port}${
							exitCode !== 0 ? ` (exit code: ${exitCode})` : ''
						}`,
					);
				},
				mapErr: (error) => 
					TunnelServiceErr({
						message: error instanceof Error ? error.message : String(error),
						cause: error,
					}),
			});
		},

		stopTunnel() {
			return trySync({
				try: () => {
					if (
						currentTunnelProcess?.process &&
						!currentTunnelProcess.process.killed
					) {
						currentTunnelProcess.process.kill('SIGTERM');
						currentTunnelProcess = null;
					}
				},
				mapErr: (error) =>
					TunnelServiceErr({
						message: `Failed to stop tunnel: ${extractErrorMessage(error)}`,
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
				'Install cloudflared:\n' +
				'  # Homebrew: brew install cloudflared\n' +
				'  # Manual: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/'
			);
		case 'linux':
			return (
				'Install cloudflared:\n' +
				'  # Debian/Ubuntu (via Cloudflare package repository):\n' +
				'  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null\n' +
				"  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main' | sudo tee /etc/apt/sources.list.d/cloudflared.list\n" +
				'  sudo apt-get update && sudo apt-get install cloudflared\n' +
				'  \n' +
				'  # RHEL/CentOS (via Cloudflare package repository):\n' +
				'  curl -fsSL https://pkg.cloudflare.com/cloudflared-ascii.repo | sudo tee /etc/yum.repos.d/cloudflared.repo\n' +
				'  sudo yum install cloudflared\n' +
				'  \n' +
				'  # Arch Linux: sudo pacman -S cloudflared\n' +
				'  # Manual: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/'
			);
		case 'win32':
			return (
				'Install cloudflared:\n' +
				'  # Winget (recommended): winget install --id=Cloudflare.cloudflared -e\n' +
				'  # Chocolatey: choco install cloudflared\n' +
				'  # Scoop: scoop install cloudflared\n' +
				'  # Manual: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/'
			);
		default:
			return 'Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/';
	}
}
