import { Hono } from 'hono';
import { auth } from './lib/auth';
import { cors } from 'hono/cors';

const app = new Hono();

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	return auth.handler(c.req.raw);
});

app.use(
	'/api/auth/*',
	cors({
		origin: ['http://localhost:5173', 'https://epicenter.sh'],
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		exposeHeaders: ['Content-Length'],
		maxAge: 600,
		credentials: true,
	}),
);

export type AppType = typeof app;

export default app;
