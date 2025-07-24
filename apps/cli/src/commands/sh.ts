import { Provider } from '@epicenter/opencode/provider/provider.ts';
import { Server } from '@epicenter/opencode/server/server.ts';
import { Share } from '@epicenter/opencode/share/share.ts';
import { bootstrap } from '@epicenter/opencode/cli/bootstrap.ts';
import { Cloudflared } from '@epicenter/opencode/util/cloudflared.ts';
import { Browser } from '@epicenter/opencode/util/browser.ts';
import { basename } from 'node:path';
import { cmd } from '../utils/cmd';
import getPort from 'get-port';

export const ShCommand = cmd({
	command: 'sh',
	builder: (yargs) =>
		yargs
			.option('port', {
				alias: ['p'],
				type: 'number',
				describe: 'port to listen on (auto-discovered if not specified)',
			})
			.option('hostname', {
				type: 'string',
				describe: 'hostname to listen on',
				default: '127.0.0.1',
			})
			.option('cors-origins', {
				alias: ['c'],
				type: 'array',
				describe: 'CORS allowed origins',
				default: ['https://epicenter.sh'],
			})
			.option('tunnel', {
				alias: ['t'],
				type: 'boolean',
				describe: 'expose via Cloudflare tunnel',
				default: true,
			})
			.option('open', {
				alias: ['o'],
				type: 'boolean',
				describe: 'open tunnel URL in browser (requires --tunnel)',
				default: true,
			}),
	describe: 'starts opencode server with epicenter.sh integration',
	handler: async (args) => {
		const cwd = process.cwd();
		await bootstrap({ cwd }, async () => {
			const providers = await Provider.list();
			if (Object.keys(providers).length === 0) {
				return 'needs_provider';
			}

			const hostname = args.hostname;
			const port = await getPort({ port: args.port });
			const corsOrigins = (args['cors-origins'] ?? []).map(String);
			const tunnel = args.tunnel;

			Share.init();
			const server = Server.listen({
				port,
				hostname,
				corsOrigins,
			});

			let tunnelProcess: Cloudflared.TunnelProcess | null = null;
			if (tunnel) {
				await Cloudflared.ensureInstalled();
				tunnelProcess = await Cloudflared.startTunnel(port);
			}

			// Display server information
			console.log(`Local server: http://${server.hostname}:${server.port}`);
			if (tunnelProcess?.url) {
				console.log(`Tunnel URL:   ${tunnelProcess.url}`);
				if (args.open) {
					console.log('Opening workspace on epicenter.sh...');
					const EPICENTER_WORKSPACE_URL =
						'https://epicenter.sh/workspaces' as const;
					const currentDirName = basename(cwd);
					const params = new URLSearchParams({
						url: tunnelProcess.url,
						port: port.toString(),
						name: currentDirName,
					});
					await Browser.openUrl(`${EPICENTER_WORKSPACE_URL}?${params}`);
				}
			}

			// Handle graceful shutdown
			const cleanup = () => {
				console.log('\nShutting down...');
				server.stop();
				if (tunnelProcess) {
					Cloudflared.stopTunnel(tunnelProcess);
				}
				process.exit(0);
			};

			process.on('SIGINT', cleanup);

			await new Promise(() => {});
		});
	},
});
