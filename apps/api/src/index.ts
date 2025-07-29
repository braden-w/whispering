import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { APP_URLS, type CloudflareEnv } from '@repo/constants/cloudflare';
import { auth } from './lib/auth';

const app = new Hono<{ Bindings: CloudflareEnv }>();

app.use('/api/auth/*', (c, next) =>
	cors({
		origin: APP_URLS(c.env),
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		exposeHeaders: ['Content-Length'],
		maxAge: 600,
		credentials: true,
	})(c, next),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	return auth(c.env).handler(c.req.raw);
});

export type AppType = typeof app;

export default app;
