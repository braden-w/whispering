import { router } from '../index';
import { assistantConfigRouter } from './assistant-config';

export const appRouter = router({
	assistantConfig: assistantConfigRouter,
});

export type AppRouter = typeof appRouter;
