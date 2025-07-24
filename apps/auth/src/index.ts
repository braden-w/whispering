import { Hono } from 'hono';
import { auth } from './lib/auth';

const app = new Hono();

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	return auth.handler(c.req.raw);
});

export type AppType = typeof app;

export default app;
