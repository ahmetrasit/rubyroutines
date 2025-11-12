import { router } from '../init';
import { authRouter } from './auth';
import { personRouter } from './person';

export const appRouter = router({
  auth: authRouter,
  person: personRouter,
});

export type AppRouter = typeof appRouter;
