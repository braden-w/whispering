import { createTunnelServiceCloudflare } from './cloudflare';
import { createTunnelServiceNgrok } from './ngrok';
import type { TunnelProvider, TunnelService } from './types';

export type {
	TunnelProcess,
	TunnelProvider,
	TunnelService,
	TunnelServiceError,
} from './types';

export function createTunnelService(provider: TunnelProvider): TunnelService {
	switch (provider) {
		case 'cloudflare':
			return createTunnelServiceCloudflare();
		case 'ngrok':
			return createTunnelServiceNgrok();
		default:
			throw new Error(`Unknown tunnel provider: ${provider}`);
	}
}
