import { router } from '../init';
import { authRouter } from './auth';
import { personRouter } from './person';
import { groupRouter } from './group';
import { routineRouter } from './routine';
import { taskRouter } from './task';
import { goalRouter } from './goal';
import { conditionRouter } from './condition';
import { kioskRouter } from './kiosk';

export const appRouter = router({
  auth: authRouter,
  person: personRouter,
  group: groupRouter,
  routine: routineRouter,
  task: taskRouter,
  goal: goalRouter,
  condition: conditionRouter,
  kiosk: kioskRouter,
});

export type AppRouter = typeof appRouter;
