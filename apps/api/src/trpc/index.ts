import { initTRPC, TRPCError } from '@trpc/server';
import type { TRPCContext } from './context';

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const procedure = t.procedure;

export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user || !ctx.session) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to perform this action',
		});
	}

	return next({
		ctx: {
			...ctx,
			user: ctx.user,
			session: ctx.session,
		},
	});
});
