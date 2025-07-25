import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { APP_URLS } from '@repo/constants';
import { auth } from './lib/auth';
import type { Env } from '@repo/constants/env-schema';

const app = new Hono<{ Bindings: Env }>();

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	return auth(c.env).handler(c.req.raw);
});

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

export type AppType = typeof app;

export default app;
