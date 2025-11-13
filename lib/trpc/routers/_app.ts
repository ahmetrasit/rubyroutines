import { router } from '../init';
import { authRouter } from './auth';
import { personRouter } from './person';
import { groupRouter } from './group';
import { routineRouter } from './routine';
import { taskRouter } from './task';
import { goalRouter } from './goal';
import { conditionRouter } from './condition';
import { kioskRouter } from './kiosk';
import { coParentRouter } from './coparent';
import { coTeacherRouter } from './coteacher';
import { connectionRouter } from './connection';
import { analyticsRouter } from './analytics';
import { marketplaceRouter } from './marketplace';
import { billingRouter } from './billing';

export const appRouter = router({
  auth: authRouter,
  person: personRouter,
  group: groupRouter,
  routine: routineRouter,
  task: taskRouter,
  goal: goalRouter,
  condition: conditionRouter,
  kiosk: kioskRouter,
  coParent: coParentRouter,
  coTeacher: coTeacherRouter,
  connection: connectionRouter,
  analytics: analyticsRouter,
  marketplace: marketplaceRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
