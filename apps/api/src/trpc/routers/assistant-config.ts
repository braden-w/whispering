import { TRPCError } from '@trpc/server';
import { type } from 'arktype';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@repo/db';
import {
	assistantConfig,
	assistantConfigInsertSchema,
	assistantConfigUpdateSchema,
} from '@repo/db/schema';
import { router, authedProcedure } from '../index';
import { extractErrorMessage } from 'wellcrafted/error';

export const assistantConfigRouter = router({
	// List all assistant configs for user
	list: authedProcedure.query(async ({ ctx }) => {
		try {
			const configs = await ctx.db.query.assistantConfig.findMany({
				where: eq(assistantConfig.userId, ctx.user.id),
				orderBy: [desc(assistantConfig.lastAccessedAt)],
			});

			return configs;
		} catch (error) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: `Failed to list assistant configurations: ${extractErrorMessage(error)}`,
			});
		}
	}),

	// Get specific assistant config
	getById: authedProcedure
		.input(type({ id: 'string' }))
		.query(async ({ ctx, input }) => {
			try {
				const config = await ctx.db.query.assistantConfig.findFirst({
					where: and(
						eq(assistantConfig.id, input.id),
						eq(assistantConfig.userId, ctx.user.id),
					),
				});

				if (!config) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Assistant configuration not found',
					});
				}

				// Update last accessed timestamp
				await ctx.db
					.update(assistantConfig)
					.set({ lastAccessedAt: new Date() })
					.where(eq(assistantConfig.id, input.id));

				return config;
			} catch (error) {
				if (error instanceof TRPCError) throw error;

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `Failed to fetch assistant configuration: ${extractErrorMessage(error)}`,
				});
			}
		}),

	// Create new assistant config
	create: authedProcedure
		.input(assistantConfigInsertSchema.omit('userId'))
		.mutation(async ({ ctx, input }) => {
			try {
				const [newConfig] = await ctx.db
					.insert(assistantConfig)
					.values({ ...input, userId: ctx.user.id })
					.returning();

				return newConfig;
			} catch (error) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `Failed to create assistant configuration: ${extractErrorMessage(error)}`,
				});
			}
		}),

	// Update assistant config
	update: authedProcedure
		.input(assistantConfigUpdateSchema.omit('userId').and({ id: 'string' }))
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			try {
				const [updated] = await ctx.db
					.update(assistantConfig)
					.set({ ...updateData })
					.where(
						and(
							eq(assistantConfig.id, id),
							eq(assistantConfig.userId, ctx.user.id),
						),
					)
					.returning();

				if (!updated) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Assistant configuration not found',
					});
				}

				return updated;
			} catch (error) {
				if (error instanceof TRPCError) throw error;

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `Failed to update assistant configuration: ${extractErrorMessage(error)}`,
				});
			}
		}),

	delete: authedProcedure
		.input(type({ id: 'string' }))
		.mutation(async ({ ctx, input }) => {
			try {
				const [deleted] = await ctx.db
					.delete(assistantConfig)
					.where(
						and(
							eq(assistantConfig.id, input.id),
							eq(assistantConfig.userId, ctx.user.id),
						),
					)
					.returning();

				if (!deleted) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Assistant configuration not found',
					});
				}

				return { message: 'Assistant config deleted successfully' };
			} catch (error) {
				if (error instanceof TRPCError) throw error;

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `Failed to delete assistant configuration: ${extractErrorMessage(error)}`,
				});
			}
		}),
});
