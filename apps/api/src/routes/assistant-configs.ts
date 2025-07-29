import { Hono } from 'hono';
import { type } from 'arktype';
import { customAlphabet } from 'nanoid';
import { eq, and, desc, DrizzleError } from 'drizzle-orm';
import { db } from '@repo/db';
import { assistantConfig } from '@repo/db/schema';
import type { CloudflareEnv } from '@repo/constants/cloudflare';
import type { Session, User } from '../lib/auth';

// Custom nanoid generator: lowercase letters + numbers, 12 chars
const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export const assistantConfigsRouter = new Hono<{
	Bindings: CloudflareEnv;
	Variables: {
		user: User;
		session: Session;
	};
}>();

assistantConfigsRouter.use('*', async (c, next) => {
	if (!c.var.user || !c.var.session) {
		return c.json({ error: 'Unauthorized' }, 401);
	}
	return next();
});

const CreateAssistantConfigBody = type({
	name: 'string',
	url: 'string.url',
	password: ['string | null', '?'],
});

const UpdateAssistantConfigBody = type({
	name: ['string', '?'],
	url: ['string.url', '?'],
	password: ['string | null', '?'],
});

// List user's assistant configs
assistantConfigsRouter.get('/', async (c) => {
	const userId = c.var.user.id;

	const configs = await db(c.env).query.assistantConfig.findMany({
		where: eq(assistantConfig.userId, userId),
		orderBy: [desc(assistantConfig.lastAccessedAt)],
	});

	return c.json(configs);
});

assistantConfigsRouter.post('/', async (c) => {
	const userId = c.var.user.id;
	const body = await c.req.json();

	const parsed = CreateAssistantConfigBody(body);
	if (parsed instanceof type.errors) {
		return c.json(
			{ error: 'Invalid request body', details: parsed.summary },
			400,
		);
	}

	try {
		const [newConfig] = await db(c.env)
			.insert(assistantConfig)
			.values({
				userId,
				id: generateId(),
				name: parsed.name,
				url: parsed.url,
				password: parsed.password ?? null,
			})
			.returning();

		return c.json(newConfig, 201);
	} catch (error) {
		// Check for unique constraint violation
		if (error instanceof DrizzleError) {
			if (error.code === '23505' && error.constraint === 'user_url_unique') {
				return c.json(
					{ error: 'You already have an assistant with this URL' },
					409,
				);
			}
		}
		throw error;
	}
});

// Get specific assistant config
assistantConfigsRouter.get('/:id', async (c) => {
	const userId = c.var.user.id;
	const configId = c.req.param('id');

	const config = await db(c.env).query.assistantConfig.findFirst({
		where: and(
			eq(assistantConfig.id, configId),
			eq(assistantConfig.userId, userId),
		),
	});

	if (!config) {
		return c.json({ error: 'Assistant config not found' }, 404);
	}

	await db(c.env)
		.update(assistantConfig)
		.set({ lastAccessedAt: new Date() })
		.where(eq(assistantConfig.id, configId));

	return c.json(config);
});

// Update assistant config
assistantConfigsRouter.put('/:id', async (c) => {
	const userId = c.var.user.id;
	const configId = c.req.param('id');
	const body = await c.req.json();

	const parsed = UpdateAssistantConfigBody(body);
	if (parsed instanceof type.errors) {
		return c.json(
			{ error: 'Invalid request body', details: parsed.summary },
			400,
		);
	}

	try {
		const [updated] = await db(c.env)
			.update(assistantConfig)
			.set({
				...parsed,
				updatedAt: new Date(),
				lastAccessedAt: new Date(),
			})
			.where(
				and(
					eq(assistantConfig.id, configId),
					eq(assistantConfig.userId, userId),
				),
			)
			.returning();

		if (!updated) {
			return c.json({ error: 'Assistant config not found' }, 404);
		}

		return c.json(updated);
	} catch (error: any) {
		// Check for unique constraint violation
		if (error.code === '23505' && error.constraint === 'user_url_unique') {
			return c.json(
				{ error: 'You already have an assistant with this URL' },
				409,
			);
		}
		throw error;
	}
});

// Delete assistant config
assistantConfigsRouter.delete('/:id', async (c) => {
	const userId = c.var.user.id;
	const configId = c.req.param('id');

	const [deleted] = await db(c.env)
		.delete(assistantConfig)
		.where(
			and(eq(assistantConfig.id, configId), eq(assistantConfig.userId, userId)),
		)
		.returning();

	if (!deleted) {
		return c.json({ error: 'Assistant config not found' }, 404);
	}

	return c.json({ message: 'Assistant config deleted successfully' });
});
