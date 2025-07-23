import type { Arguments, CommandBuilder } from 'yargs';
import { findAvailablePort } from '../utils/port.js';
import { ServeCommand } from '@epicenter/opencode/serve';

type Options = {
	port?: number;
	hostname?: string;
	'cors-origins'?: string[];
	tunnel?: boolean;
	open?: boolean;
};

export const command = 'sh [options]';
export const desc =
	'Start opencode server with intelligent epicenter.sh integration';

export const builder: CommandBuilder<Options, Options> = (yargs) =>
	yargs
		.option('port', {
			alias: 'p',
			type: 'number',
			describe: 'port to listen on (auto-discovered if not specified)',
		})
		.option('hostname', {
			alias: 'h',
			type: 'string',
			describe: 'hostname to listen on',
			default: '127.0.0.1',
		})
		.option('cors-origins', {
			alias: 'c',
			type: 'array',
			describe: 'CORS allowed origins',
			default: ['https://epicenter.sh'],
		})
		.option('tunnel', {
			alias: 't',
			type: 'boolean',
			describe: 'expose via Cloudflare tunnel',
			default: true,
		})
		.option('open', {
			alias: 'o',
			type: 'boolean',
			describe: 'open tunnel URL in browser',
			default: true,
		});

export const handler = async (argv: Arguments<Options>): Promise<void> => {
	console.log('🚀 Starting opencode with epicenter.sh integration...');

	// Auto-discover port if not specified
	const port = argv.port || (await findAvailablePort(4096));

	console.log(`📍 Using port: ${port}`);
	console.log(`🌐 CORS origins: ${argv['cors-origins']?.join(', ')}`);
	console.log(`🚇 Tunnel: ${argv.tunnel ? 'enabled' : 'disabled'}`);
	console.log(`🌍 Auto-open: ${argv.open ? 'enabled' : 'disabled'}`);

	// Import and execute the serve command from @epicenter/opencode
	try {
		// Call the underlying serve command with our smart defaults
		await ServeCommand.handler({
			...argv,
			port,
			hostname: argv.hostname || '127.0.0.1',
			'cors-origins': argv['cors-origins'] || ['https://epicenter.sh'],
			tunnel: argv.tunnel !== false, // Default to true unless explicitly false
			open: argv.open !== false, // Default to true unless explicitly false
		});
	} catch (error) {
		console.error('❌ Failed to start opencode server:', error);
		process.exit(1);
	}
};
