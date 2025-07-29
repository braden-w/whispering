import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { createFactory } from 'hono/factory';
import { type } from 'arktype';
import { customAlphabet } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@repo/db';
import {
	assistantConfig,
	assistantConfigInsertSchema,
	assistantConfigUpdateSchema,
	type AssistantConfigInsert,
	type AssistantConfigUpdate,
} from '@repo/db/schema';
import type { CloudflareEnv } from '@repo/constants/cloudflare';
import type { Session, User } from '../lib/auth';

// Custom nanoid generator: lowercase letters + numbers, 12 chars

const factory = createFactory<{
	Bindings: CloudflareEnv;
	Variables: {
		user: User;
		session: Session;
	};
}>();

const requireAuth = factory.createMiddleware(async (c, next) => {
	if (!c.var.user || !c.var.session) {
		return c.json({ error: 'Unauthorized' }, 401);
	}
	return next();
});

export const assistantConfigsRouter = new Hono<{
	Bindings: CloudflareEnv;
	Variables: {
		user: User;
		session: Session;
	};
}>();

assistantConfigsRouter.use('*', requireAuth);

assistantConfigsRouter.get('/', async (c) => {
	const userId = c.var.user.id;

	const configs = await db(c.env).query.assistantConfig.findMany({
		where: eq(assistantConfig.userId, userId),
		orderBy: [desc(assistantConfig.lastAccessedAt)],
	});

	return c.json(configs);
});

assistantConfigsRouter.post(
	'/',
	validator('json', (value, c) => {
		const parsed = assistantConfigInsertSchema.omit('userId')(value);
		if (parsed instanceof type.errors) {
			return c.json(
				{ error: 'Invalid request body', details: parsed.summary },
				400,
			);
		}
		return parsed;
	}),
	async (c) => {
		const userId = c.var.user.id;
		const validatedData = c.req.valid('json');

		try {
			const [newConfig] = await db(c.env)
				.insert(assistantConfig)
				.values({ ...validatedData, userId })
				.returning();

			return c.json(newConfig, 201);
		} catch (error) {
			// Check for unique constraint violation
			if (error instanceof Error && 'code' in error) {
				const dbError = error as { code: string; constraint?: string };
				if (
					dbError.code === '23505' &&
					dbError.constraint === 'user_url_unique'
				) {
					return c.json(
						{ error: 'You already have an assistant with this URL' },
						409,
					);
				}
			}
			throw error;
		}
	},
);

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

assistantConfigsRouter.put(
	'/:id',
	validator('json', (value, c) => {
		const parsed = assistantConfigUpdateSchema.omit('userId')(value);
		if (parsed instanceof type.errors) {
			return c.json(
				{ error: 'Invalid request body', details: parsed.summary },
				400,
			);
		}
		return parsed;
	}),
	async (c) => {
		const userId = c.var.user.id;
		const configId = c.req.param('id');
		const validatedData = c.req.valid('json');

		try {
			const [updated] = await db(c.env)
				.update(assistantConfig)
				.set({ ...validatedData, userId })
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
		} catch (error) {
			if (error instanceof Error && 'code' in error) {
				const dbError = error as { code: string; constraint?: string };
				if (
					dbError.code === '23505' &&
					dbError.constraint === 'user_url_unique'
				) {
					return c.json(
						{ error: 'You already have an assistant with this URL' },
						409,
					);
				}
			}
			throw error;
		}
	},
);

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
