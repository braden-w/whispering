import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { APP_URLS } from '@repo/constants';
import { auth } from './lib/auth';
import type { Env } from '@repo/constants/env';

const app = new Hono<{ Bindings: Env }>();

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	return auth(c.env).handler(c.req.raw);
});

app.use(
	'/api/auth/*',
	cors({
		origin: APP_URLS,
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		exposeHeaders: ['Content-Length'],
		maxAge: 600,
		credentials: true,
	}),
);

export type AppType = typeof app;

export default app;
