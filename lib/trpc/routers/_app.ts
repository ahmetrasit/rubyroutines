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
import { personConnectionRouter } from './person-connection';
import { invitationRouter } from './invitation';
import { analyticsRouter } from './analytics';
import { marketplaceRouter } from './marketplace';
import { billingRouter } from './billing';
import { adminUsersRouter } from './admin-users';
import { adminSettingsRouter } from './admin-settings';
import { adminTiersRouter } from './admin-tiers';
import { adminAuditRouter } from './admin-audit';
import { adminMarketplaceRouter } from './admin-marketplace';
import { adminModerationRouter } from './admin-moderation';
import { adminModerationLogsRouter } from './admin-moderation-logs';
import { gdprRouter } from './gdpr';
import { streakRouter } from './streak';
import { twoFactorRouter } from './two-factor';
import { blogRouter } from './blog';
import { teacherStudentLinkRouter } from './teacher-student-link';
import { schoolRouter } from './school';
// import { notificationRouter } from './notification';

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
  personConnection: personConnectionRouter,
  invitation: invitationRouter,
  analytics: analyticsRouter,
  marketplace: marketplaceRouter,
  billing: billingRouter,
  adminUsers: adminUsersRouter,
  adminSettings: adminSettingsRouter,
  adminTiers: adminTiersRouter,
  adminAudit: adminAuditRouter,
  adminMarketplace: adminMarketplaceRouter,
  adminModeration: adminModerationRouter,
  adminModerationLogs: adminModerationLogsRouter,
  gdpr: gdprRouter,
  streak: streakRouter,
  blog: blogRouter,
  teacherStudentLink: teacherStudentLinkRouter,
  school: schoolRouter,
  // notification: notificationRouter, // Disabled: Notification table not in schema yet
});

export type AppRouter = typeof appRouter;
