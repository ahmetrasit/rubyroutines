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
import { invitationRouter } from './invitation';
import { analyticsRouter } from './analytics';
import { marketplaceRouter } from './marketplace';
import { billingRouter } from './billing';
import { adminUsersRouter } from './admin-users';
import { adminSettingsRouter } from './admin-settings';
import { adminTiersRouter } from './admin-tiers';
import { adminAuditRouter } from './admin-audit';

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
  invitation: invitationRouter,
  analytics: analyticsRouter,
  marketplace: marketplaceRouter,
  billing: billingRouter,
  adminUsers: adminUsersRouter,
  adminSettings: adminSettingsRouter,
  adminTiers: adminTiersRouter,
  adminAudit: adminAuditRouter,
});

export type AppRouter = typeof appRouter;
