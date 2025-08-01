import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';

export const { TunnelServiceError, TunnelServiceErr } =
	createTaggedError('TunnelServiceError');
type TunnelServiceError = ReturnType<typeof TunnelServiceError>;

export type TunnelProvider = 'cloudflare' | 'ngrok';

export type TunnelService = {
	ensureInstalled(): Promise<Result<void, TunnelServiceError>>;
	startTunnel(port: number): Promise<Result<string, TunnelServiceError>>;
	stopTunnel(): Result<void, TunnelServiceError>;
};
