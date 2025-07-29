import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { createFactory } from 'hono/factory';
import { type } from 'arktype';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@repo/db';
import {
	assistantConfig,
	assistantConfigInsertSchema,
	assistantConfigUpdateSchema,
} from '@repo/db/schema';
import type { CloudflareEnv } from '@repo/constants/cloudflare';
import type { Session, User } from '../lib/auth';
import { createTaggedError, extractErrorMessage } from 'wellcrafted/error';
import { Err, Ok, tryAsync } from 'wellcrafted/result';

// Create tagged errors for assistant config operations
const { AssistantConfigError, AssistantConfigErr } = createTaggedError(
	'AssistantConfigError',
);
export type AssistantConfigError = ReturnType<typeof AssistantConfigError>;

// Create factory for type-safe middleware
const factory = createFactory<{
	Bindings: CloudflareEnv;
	Variables: {
		user: User;
		session: Session;
	};
}>();

// Auth middleware
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

// List all assistant configs for user
assistantConfigsRouter.get('/', async (c) => {
	const userId = c.var.user.id;

	const { data: configs, error } = await tryAsync({
		try: () =>
			db(c.env).query.assistantConfig.findMany({
				where: eq(assistantConfig.userId, userId),
				orderBy: [desc(assistantConfig.lastAccessedAt)],
			}),
		mapErr: (error) =>
			AssistantConfigErr({
				message: `Failed to list assistant configurations: ${extractErrorMessage(error)}`,
				cause: error,
			}),
	});

	if (error) return c.json(Err(error), 500);
	return c.json(Ok(configs));
});

// Create new assistant config
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

		const { data: newConfig, error } = await tryAsync({
			try: () =>
				db(c.env)
					.insert(assistantConfig)
					.values({ ...validatedData, userId })
					.returning()
					.then(([config]) => config),
			mapErr: (error) =>
				AssistantConfigErr({
					message: `Failed to create assistant configuration: ${extractErrorMessage(error)}`,
					cause: error,
				}),
		});

		if (error) return c.json(Err(error), 500);

		return c.json(Ok(newConfig), 201);
	},
);

// Get specific assistant config
assistantConfigsRouter.get('/:id', async (c) => {
	const userId = c.var.user.id;
	const configId = c.req.param('id');

	const { data: config, error } = await tryAsync({
		try: () =>
			db(c.env).query.assistantConfig.findFirst({
				where: and(
					eq(assistantConfig.id, configId),
					eq(assistantConfig.userId, userId),
				),
			}),
		mapErr: (error) =>
			AssistantConfigErr({
				message: `Failed to fetch assistant configuration: ${extractErrorMessage(error)}`,
				cause: error,
			}),
	});

	if (error) return c.json(Err(error), 500);

	if (!config) {
		return c.json(
			Err(
				AssistantConfigError({
					message: 'Assistant configuration not found',
					cause: new Error('NOT_FOUND'),
				}),
			),
			404,
		);
	}

	// Update last accessed timestamp
	await db(c.env)
		.update(assistantConfig)
		.set({ lastAccessedAt: new Date() })
		.where(eq(assistantConfig.id, configId));

	return c.json(Ok(config));
});

// Update assistant config
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

		const { data: updatedConfigs, error } = await tryAsync({
			try: () =>
				db(c.env)
					.update(assistantConfig)
					.set({ ...validatedData, userId })
					.where(
						and(
							eq(assistantConfig.id, configId),
							eq(assistantConfig.userId, userId),
						),
					)
					.returning(),
			mapErr: (error) =>
				AssistantConfigErr({
					message: `Failed to update assistant configuration: ${extractErrorMessage(error)}`,
					cause: error,
				}),
		});

		if (error) return c.json(Err(error), 500);

		const [updated] = updatedConfigs || [];
		if (!updated) {
			return c.json(
				Err(
					AssistantConfigError({
						message: 'Assistant configuration not found',
						cause: new Error('NOT_FOUND'),
					}),
				),
				404,
			);
		}

		return c.json(Ok(updated));
	},
);

// Delete assistant config
assistantConfigsRouter.delete('/:id', async (c) => {
	const userId = c.var.user.id;
	const configId = c.req.param('id');

	const { data: deletedConfigs, error } = await tryAsync({
		try: () =>
			db(c.env)
				.delete(assistantConfig)
				.where(
					and(
						eq(assistantConfig.id, configId),
						eq(assistantConfig.userId, userId),
					),
				)
				.returning(),
		mapErr: (error) =>
			AssistantConfigErr({
				message: `Failed to delete assistant configuration: ${extractErrorMessage(error)}`,
				cause: error,
			}),
	});

	if (error) return c.json(Err(error), 500);

	const [deleted] = deletedConfigs || [];
	if (!deleted) {
		return c.json(
			Err(
				AssistantConfigError({
					message: 'Assistant configuration not found',
					cause: new Error('NOT_FOUND'),
				}),
			),
			404,
		);
	}

	return c.json(Ok({ message: 'Assistant config deleted successfully' }));
});

// Export route type for RPC if needed
export type AssistantConfigsRouter = typeof assistantConfigsRouter;
