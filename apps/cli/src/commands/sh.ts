import { Provider } from '@epicenter/opencode/provider/provider.ts';
import { Server } from '@epicenter/opencode/server/server.ts';
import { Share } from '@epicenter/opencode/share/share.ts';
import { bootstrap } from '@epicenter/opencode/cli/bootstrap.ts';
import { Cloudflared } from '@epicenter/opencode/util/cloudflared.ts';
import { Browser } from '@epicenter/opencode/util/browser.ts';
import { Log } from '@epicenter/opencode/util/log.ts';
import { basename } from 'node:path';
import { cmd } from '../utils/cmd';
import getPort from 'get-port';

const EPICENTER_SH_URL = 'https://epicenter.sh' as const;

const log = Log.create({ service: 'sh' });

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
				default: [EPICENTER_SH_URL],
			})
			.option('tunnel', {
				alias: ['t'],
				type: 'boolean',
				describe: 'expose via Cloudflare tunnel (use --no-tunnel to disable)',
				default: true,
			})
			.option('open', {
				alias: ['o'],
				type: 'boolean',
				describe: 'open tunnel URL in browser (use --no-open to disable)',
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

			const localUrl = `http://${server.hostname}:${server.port}`;

			// Display server information
			console.log('\n✓ Server running\n');
			console.log(`  Local:      ${localUrl}`);

			let tunnelProcess: Cloudflared.TunnelProcess | null = null;
			if (tunnel) {
				await Cloudflared.ensureInstalled();
				tunnelProcess = await Cloudflared.startTunnel(port);
			}

			if (tunnelProcess?.url) {
				console.log(`  Tunnel:     ${tunnelProcess.url}`);
				if (args.open) {
					const EPICENTER_ASSISTANT_URL =
						`${EPICENTER_SH_URL}/assistants` as const;
					const currentDirName = basename(cwd);
					const params = new URLSearchParams({
						url: tunnelProcess.url,
						port: port.toString(),
						name: currentDirName,
					});
					const url = `${EPICENTER_ASSISTANT_URL}?${params}` as const;
					console.log(`  Epicenter:  ${url}`);
					console.log();
					console.log('  Opening browser...');
					await Browser.openUrl(url);
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
