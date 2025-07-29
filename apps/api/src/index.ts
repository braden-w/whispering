import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { APP_URLS, type CloudflareEnv } from '@repo/constants/cloudflare';
import { auth, type Session, type User, type AuthType } from './lib/auth';
import { assistantConfigsRouter } from './routes/assistant-configs';

const app = new Hono<{
	Bindings: CloudflareEnv;
	Variables: {
		user: User | null;
		session: Session | null;
	};
}>();

// CORS middleware for all routes
app.use('*', (c, next) =>
	cors({
		origin: APP_URLS(c.env),
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
		exposeHeaders: ['Content-Length'],
		maxAge: 600,
		credentials: true,
	})(c, next),
);

// Better Auth session middleware - validates session on every request
app.use('*', async (c, next) => {
	const session = await auth(c.env).api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		c.set('user', null);
		c.set('session', null);
		return next();
	}

	c.set('user', session.user);
	c.set('session', session.session);
	return next();
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	return auth(c.env).handler(c.req.raw);
});

app.route('/api/assistant-configs', assistantConfigsRouter);

app.get('/health', (c) => {
	return c.json({ status: 'ok' });
});

export type ApiType = typeof app;

export default app;
