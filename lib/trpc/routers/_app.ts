import { router } from '../init';
import { authRouter } from './auth';
import { personRouter } from './person';
import { routineRouter } from './routine';

export const appRouter = router({
  auth: authRouter,
  person: personRouter,
  routine: routineRouter,
});

export type AppRouter = typeof appRouter;
