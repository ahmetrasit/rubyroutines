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
import { personSharingRouter } from './person-sharing';
import { analyticsRouter } from './analytics';
import { marketplaceRouter } from './marketplace';
import { billingRouter } from './billing';
import { adminUsersRouter } from './admin-users';
import { adminSettingsRouter } from './admin-settings';
import { adminTiersRouter } from './admin-tiers';
import { adminAuditRouter } from './admin-audit';
import { adminMarketplaceRouter } from './admin-marketplace';
import { gdprRouter } from './gdpr';
import { streakRouter } from './streak';
import { twoFactorRouter } from './two-factor';

export const appRouter = router({
  auth: authRouter,
  twoFactor: twoFactorRouter,
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
  personSharing: personSharingRouter,
  analytics: analyticsRouter,
  marketplace: marketplaceRouter,
  billing: billingRouter,
  adminUsers: adminUsersRouter,
  adminSettings: adminSettingsRouter,
  adminTiers: adminTiersRouter,
  adminAudit: adminAuditRouter,
  adminMarketplace: adminMarketplaceRouter,
  gdpr: gdprRouter,
  streak: streakRouter,
});

export type AppRouter = typeof appRouter;
