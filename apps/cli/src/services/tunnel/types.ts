import { createTaggedError } from 'wellcrafted/error';
import type { Result } from 'wellcrafted/result';
import type { Subprocess } from 'bun';

export const { TunnelServiceError, TunnelServiceErr } =
	createTaggedError('TunnelServiceError');
type TunnelServiceError = ReturnType<typeof TunnelServiceError>;

export type TunnelProcess = {
	process: Subprocess;
	url: string | null;
};

export type TunnelProvider = 'cloudflare' | 'ngrok';

export type TunnelService = {
	ensureInstalled(): Promise<Result<void, TunnelServiceError>>;
	startTunnel(port: number): Promise<Result<TunnelProcess, TunnelServiceError>>;
	stopTunnel(): Result<void, TunnelServiceError>;
};
