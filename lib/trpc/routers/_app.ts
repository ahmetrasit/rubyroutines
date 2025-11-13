import { router } from '../init';
import { authRouter } from './auth';
import { personRouter } from './person';
import { routineRouter } from './routine';
import { taskRouter } from './task';

export const appRouter = router({
  auth: authRouter,
  person: personRouter,
  routine: routineRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
