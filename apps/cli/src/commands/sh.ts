import { ServeCommand } from '@epicenter/opencode/serve' with { type: "macro" };
import getPort from 'get-port';
import { cmd } from '../utils/cmd.js';

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
				alias: ['h'],
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
				describe: 'open tunnel URL in browser',
				default: true,
			}),
	describe: 'starts opencode server with epicenter.sh integration',
	handler: async (args) => {
		console.log('🚀 Starting opencode with epicenter.sh integration...');

		const port = await getPort({ port: args.port });

		// Prepare arguments with our defaults
		const serveArgs = {
			...args,
			port,
			hostname: args.hostname || '127.0.0.1',
			'cors-origins': args['cors-origins'] || ['https://epicenter.sh'],
			tunnel: args.tunnel !== false, // Default to true
			open: args.open !== false, // Default to true
		};

		console.log(`📍 Using port: ${port}`);
		console.log(`🌐 CORS origins: ${serveArgs['cors-origins'].join(', ')}`);
		console.log(`🚇 Tunnel: ${serveArgs.tunnel ? 'enabled' : 'disabled'}`);
		console.log(`🌍 Auto-open: ${serveArgs.open ? 'enabled' : 'disabled'}`);

		// Delegate to the existing serve command
		await ServeCommand.handler(serveArgs);
	},
});
