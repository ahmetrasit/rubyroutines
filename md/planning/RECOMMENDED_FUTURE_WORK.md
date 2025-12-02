# Ruby Routines - Recommended Future Work

**Version:** 1.0
**Last Updated:** 2025-11-13
**Current Security Grade:** B+
**Target Security Grade:** A-

---

## 📊 **Priority & Impact Matrix**

**Severity Levels:**
- 🔴 **CRITICAL** - Security vulnerabilities, data loss risks, compliance violations
- 🟠 **HIGH** - Major features, significant UX improvements, performance issues
- 🟡 **MEDIUM** - Quality of life, minor features, optimizations
- 🟢 **LOW** - Nice-to-haves, polish, future planning

**Impact Levels:**
- 💥 **HIGH** - Affects all users, core functionality, security posture
- 🎯 **MEDIUM** - Affects specific features or user groups
- ✨ **LOW** - Incremental improvements, edge cases

---

## 🔒 **SECURITY ENHANCEMENTS (B+ → A-)**

### 1. Rate Limiting Implementation
**Severity:** 🔴 CRITICAL | **Impact:** 💥 HIGH | **Effort:** Medium (2-3 days)

**Current State:** No rate limiting on any endpoints

**Security Risk:**
- Brute force attacks on kiosk codes (2-word codes = 4M combinations)
- Brute force verification codes (6 digits = 1M combinations)
- API abuse and DoS attacks
- Unlimited password attempts

**Recommended Solution:**
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis

// Implement rate limiting middleware
- Auth endpoints: 5 attempts per 15 minutes per IP
- Verification code: 3 attempts per hour per user
- Kiosk code validation: 10 attempts per hour per IP
- API endpoints: 100 requests per minute per user
- Global: 1000 requests per minute per IP
```

**Implementation:**
- [ ] Set up Upstash Redis (serverless, free tier available)
- [ ] Create rate limit middleware in `/lib/trpc/middleware/ratelimit.ts`
- [ ] Apply to vulnerable endpoints (auth, kiosk, verification)
- [ ] Add rate limit headers to responses
- [ ] Implement exponential backoff for repeated violations
- [ ] Log rate limit violations for monitoring

**Expected Outcome:** Prevents automated attacks, improves security grade

---

### 2. Security Headers & CSP
**Severity:** 🟠 HIGH | **Impact:** 💥 HIGH | **Effort:** Low (1 day)

**Current State:** Default Next.js security headers only

**Security Risk:**
- XSS attacks through third-party scripts
- Clickjacking vulnerabilities
- MIME-type sniffing attacks
- Missing security hardening

**Recommended Solution:**
```typescript
// Update next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        // Content Security Policy
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com;"
        },
        // Prevent clickjacking
        { key: 'X-Frame-Options', value: 'DENY' },
        // Prevent MIME sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // Enable XSS filter
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        // HTTPS only
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        // Referrer policy
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Permissions policy
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }];
  }
};
```

**Implementation:**
- [ ] Add security headers to Next.js config
- [ ] Test CSP with browser console for violations
- [ ] Adjust CSP for Stripe, Supabase, D3.js requirements
- [ ] Test on staging before production
- [ ] Monitor for CSP violations in production

**Expected Outcome:** Hardens against XSS, clickjacking, injection attacks

---

### 3. Supabase Row Level Security (RLS) Policies
**Severity:** 🔴 CRITICAL | **Impact:** 💥 HIGH | **Effort:** High (1 week)

**Current State:** All security at application level only

**Security Risk:**
- If application security bypassed, database fully exposed
- Direct Supabase access could leak all data
- No defense-in-depth strategy
- Single point of failure

**Recommended Solution:**
Implement RLS policies as documented in `/supabase/policies.sql` (949 lines)

**Key Policies Needed:**
```sql
-- Users can only see own roles
CREATE POLICY "users_own_roles" ON roles
  FOR ALL USING (user_id = auth.uid());

-- Users can only see persons from own roles
CREATE POLICY "users_own_persons" ON persons
  FOR ALL USING (
    role_id IN (SELECT id FROM roles WHERE user_id = auth.uid())
  );

-- Co-parent access policies
CREATE POLICY "coparent_shared_persons" ON persons
  FOR SELECT USING (
    id IN (
      SELECT unnest(person_ids) FROM co_parents
      WHERE co_parent_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
      AND status = 'ACTIVE'
    )
  );

-- Similar policies for routines, tasks, goals, etc.
```

**Implementation:**
- [ ] Review existing policies in `/supabase/policies.sql`
- [ ] Enable RLS on all tables
- [ ] Apply CREATE, SELECT, UPDATE, DELETE policies
- [ ] Test each policy with real user scenarios
- [ ] Verify co-parent permissions work correctly
- [ ] Test performance impact of complex policies
- [ ] Add indexes to optimize RLS queries

**Expected Outcome:** Defense-in-depth, database-level security enforcement

---

### 4. Comprehensive Audit Logging
**Severity:** 🟠 HIGH | **Impact:** 💥 HIGH | **Effort:** Medium (3-4 days)

**Current State:** Basic logging utility, no audit trail

**Security Risk:**
- Cannot detect security breaches
- No accountability for actions
- Cannot investigate incidents
- No compliance audit trail (GDPR, COPPA)

**Recommended Solution:**
```typescript
// Create audit logging system
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string; // e.g., "person.create", "auth.login"
  resource: string; // Resource type affected
  resourceId: string; // Specific resource ID
  changes: object; // Before/after values
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

// Log critical operations
- Authentication events (login, logout, failed attempts)
- Authorization failures
- Data modifications (create, update, delete)
- Permission changes (co-parent invites, revocations)
- Billing events (subscriptions, cancellations)
- Sensitive data access (analytics exports)
```

**Implementation:**
- [ ] Create `AuditLog` table in database
- [ ] Add audit middleware to tRPC procedures
- [ ] Log all security-relevant events
- [ ] Create audit log viewer for admins
- [ ] Set up log retention policy (90 days)
- [ ] Export logs to SIEM system (Datadog, Splunk)
- [ ] Create alerts for suspicious patterns

**Expected Outcome:** Complete audit trail, security monitoring, compliance

---

### 5. Automated Security Scanning
**Severity:** 🟠 HIGH | **Impact:** 💥 HIGH | **Effort:** Medium (2-3 days)

**Current State:** No automated security scanning

**Recommended Tools:**
- **Dependabot:** Automatic dependency vulnerability alerts
- **Snyk:** Vulnerability scanning in CI/CD pipeline
- **npm audit:** Regular dependency audits
- **OWASP ZAP:** Automated penetration testing
- **SonarQube:** Code quality and security analysis

**Implementation:**
- [ ] Enable Dependabot on GitHub repository
- [ ] Add Snyk integration to CI/CD
- [ ] Schedule weekly `npm audit` in CI
- [ ] Run OWASP ZAP against staging weekly
- [ ] Set up SonarQube for code analysis
- [ ] Create security scan failure thresholds
- [ ] Require security review for high-risk changes

**Expected Outcome:** Continuous security monitoring, early vulnerability detection

---

### 6. Penetration Testing & Bug Bounty
**Severity:** 🟡 MEDIUM | **Impact:** 💥 HIGH | **Effort:** Ongoing

**Current State:** No external security validation

**Recommended Approach:**
1. **Internal Penetration Testing** (quarterly)
   - Hire security firm for professional assessment
   - Test all authentication/authorization boundaries
   - Attempt SQL injection, XSS, CSRF attacks
   - Test rate limiting and DoS resilience

2. **Bug Bounty Program** (after launch)
   - Use platform like HackerOne or Bugcrowd
   - Offer rewards for vulnerability discoveries
   - Start with private program, expand to public
   - Typical rewards: $50-$5000 based on severity

**Implementation:**
- [ ] Contract penetration testing firm
- [ ] Address all findings from pen test
- [ ] Set up bug bounty program on HackerOne
- [ ] Define scope and reward structure
- [ ] Create vulnerability disclosure policy
- [ ] Monitor submissions and respond quickly

**Expected Outcome:** External validation, community-driven security

---

### 7. Secrets Management
**Severity:** 🟠 HIGH | **Impact:** 🎯 MEDIUM | **Effort:** Low (1 day)

**Current State:** Environment variables in `.env` files

**Security Risk:**
- `.env` files could be committed to Git
- No secret rotation policy
- No audit trail for secret access
- Secrets visible in server logs if leaked

**Recommended Solution:**
- Use **Vercel Environment Variables** (production)
- Use **Doppler** or **AWS Secrets Manager** for team access
- Implement secret rotation schedule:
  - Stripe keys: Every 90 days
  - Supabase keys: Every 180 days
  - JWT secrets: Every 90 days

**Implementation:**
- [ ] Move all secrets to Vercel dashboard
- [ ] Set up secret rotation reminders
- [ ] Use different secrets per environment (dev/staging/prod)
- [ ] Add `.env` to `.gitignore` (verify)
- [ ] Document secret rotation procedure
- [ ] Implement secret encryption at rest

**Expected Outcome:** Reduced secret exposure risk, better secret lifecycle management

---

### 8. Enhanced Password Security
**Severity:** 🟡 MEDIUM | **Impact:** 🎯 MEDIUM | **Effort:** Medium (2 days)

**Current State:** Supabase handles password hashing

**Recommended Enhancements:**
- Password strength requirements (already good with min 8 chars)
- Password breach detection (Have I Been Pwned API)
- Password complexity requirements
- Password history (prevent reuse)
- Account lockout after failed attempts

**Implementation:**
```typescript
// Check password against breach database
import { pwnedPassword } from 'hibp';

async function validatePassword(password: string) {
  // Check minimum requirements
  if (password.length < 8) return false;

  // Check against breach database
  const breachCount = await pwnedPassword(password);
  if (breachCount > 0) {
    throw new Error('This password has been found in data breaches. Please choose a different password.');
  }

  // Check complexity (at least 3 of: lowercase, uppercase, number, special)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const complexity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (complexity < 3) {
    throw new Error('Password must contain at least 3 of: lowercase, uppercase, numbers, special characters');
  }

  return true;
}
```

**Implementation:**
- [ ] Install `hibp` package for breach detection
- [ ] Add password complexity validation
- [ ] Implement account lockout (5 failed attempts = 15 min lockout)
- [ ] Store password hashes with higher bcrypt cost (12-14 rounds)
- [ ] Add password change flow
- [ ] Implement password history (prevent last 5 passwords)

**Expected Outcome:** Stronger passwords, reduced account compromise risk

---

### 9. Two-Factor Authentication (2FA)
**Severity:** 🟡 MEDIUM | **Impact:** 💥 HIGH | **Effort:** High (1-2 weeks)

**Current State:** Email verification only

**Recommended Approach:**
- TOTP (Time-based One-Time Password) using authenticator apps
- SMS backup codes
- Recovery codes for account recovery

**Implementation:**
```typescript
// Install: npm install speakeasy qrcode

// Generate 2FA secret
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

async function enable2FA(userId: string) {
  const secret = speakeasy.generateSecret({
    name: 'Ruby Routines',
    issuer: 'RubyRoutines'
  });

  // Generate QR code for authenticator app
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  // Store secret (encrypted) in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encrypt(secret.base32),
      twoFactorEnabled: false // Enable after verification
    }
  });

  return { qrCode, secret: secret.base32 };
}

// Verify 2FA token
function verify2FA(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time windows for clock drift
  });
}
```

**Implementation:**
- [ ] Add 2FA fields to User table (secret, enabled, backup codes)
- [ ] Create 2FA setup flow (QR code, verification)
- [ ] Add 2FA check to login flow
- [ ] Generate backup codes for recovery
- [ ] Create 2FA disable/reset flow
- [ ] Require 2FA for sensitive operations (billing, admin)
- [ ] Add "Trust this device" option (30 days)

**Expected Outcome:** Significantly reduced account takeover risk

---

### 10. Security Monitoring & Alerting
**Severity:** 🟠 HIGH | **Impact:** 💥 HIGH | **Effort:** Medium (3-4 days)

**Current State:** No real-time security monitoring

**Recommended Setup:**
- **Sentry:** Error tracking and security alerts
- **Datadog:** APM and security monitoring
- **CloudFlare:** DDoS protection and WAF

**Alert Triggers:**
- Multiple failed login attempts (>5 in 15 min)
- Authorization failures spike (>10 in 1 min)
- Unusual data access patterns
- Kiosk code brute force attempts
- Mass data exports
- Admin actions in production
- Database errors or anomalies

**Implementation:**
- [ ] Set up Sentry with security alerts
- [ ] Configure Datadog APM
- [ ] Create custom security dashboards
- [ ] Set up PagerDuty for critical alerts
- [ ] Define escalation procedures
- [ ] Create runbook for common incidents
- [ ] Schedule weekly security reviews

**Expected Outcome:** Real-time threat detection, rapid incident response

---

## 📊 **COMPLIANCE & LEGAL**

### 11. GDPR Compliance Implementation
**Severity:** 🔴 CRITICAL | **Impact:** 💥 HIGH | **Effort:** High (2 weeks)

**Current State:** No GDPR features implemented

**Required Features:**
1. **Right to Access** (Article 15)
   - User can export all their data in portable format (JSON/CSV)

2. **Right to Erasure** (Article 17)
   - User can delete account and all associated data
   - Cascading deletion of persons, routines, tasks, completions

3. **Right to Data Portability** (Article 20)
   - Export data in machine-readable format

4. **Privacy by Design** (Article 25)
   - Minimize data collection
   - Pseudonymization where possible

5. **Consent Management** (Article 7)
   - Clear consent for data processing
   - Ability to withdraw consent

6. **Data Breach Notification** (Article 33)
   - Notify users within 72 hours of breach

**Implementation:**
```typescript
// Data export endpoint
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          persons: {
            include: {
              assignments: {
                include: {
                  routine: {
                    include: { tasks: true }
                  }
                }
              }
            }
          },
          goals: true,
          // ... all related data
        }
      }
    }
  });

  return {
    format: 'json',
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: user
  };
}

// Account deletion
export async function deleteUserAccount(userId: string) {
  // Anonymize data that must be retained (billing records)
  await prisma.invoice.updateMany({
    where: { userId },
    data: { userEmail: 'deleted@example.com' }
  });

  // Delete all user data
  await prisma.$transaction([
    prisma.taskCompletion.deleteMany({ where: { person: { role: { userId } } } }),
    prisma.task.deleteMany({ where: { routine: { roleId: { in: userRoles } } } }),
    prisma.routine.deleteMany({ where: { roleId: { in: userRoles } } }),
    prisma.person.deleteMany({ where: { roleId: { in: userRoles } } }),
    prisma.role.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ]);
}
```

**Implementation:**
- [ ] Create data export page (`/settings/export-data`)
- [ ] Implement export to JSON/CSV
- [ ] Create account deletion flow with confirmation
- [ ] Add consent checkboxes during signup
- [ ] Create privacy policy page
- [ ] Implement cookie consent banner
- [ ] Add data retention policy (delete inactive accounts after 2 years)
- [ ] Document data processing activities
- [ ] Appoint Data Protection Officer (if required)

**Expected Outcome:** GDPR compliance, legal protection

---

### 12. COPPA Compliance (Children Under 13)
**Severity:** 🔴 CRITICAL | **Impact:** 💥 HIGH | **Effort:** High (1-2 weeks)

**Current State:** No COPPA features

**Required Features:**
1. **Parental Consent** (Mandatory)
   - Verify parent before allowing child data collection
   - FTC-approved verification methods:
     - Credit card verification ($0.50 charge)
     - Government ID upload
     - Video chat verification
     - Knowledge-based authentication

2. **Age Gate**
   - Ask date of birth during signup
   - Redirect users under 13 to parental consent flow

3. **Limited Data Collection**
   - Collect only data necessary for service
   - No targeted advertising to children
   - No selling children's data

4. **Parental Control**
   - Parents can review child's data
   - Parents can delete child's data
   - Parents can disable child's account

**Implementation:**
```typescript
// Age gate during signup
async function checkAge(dateOfBirth: Date): Promise<boolean> {
  const age = calculateAge(dateOfBirth);
  if (age < 13) {
    return false; // Redirect to parental consent
  }
  return true; // Allow signup
}

// Parental consent flow
async function requestParentalConsent(parentEmail: string, childName: string) {
  // Send consent request to parent
  await sendEmail({
    to: parentEmail,
    subject: 'Parental Consent Required',
    template: 'parental-consent',
    data: { childName }
  });

  // Generate verification link
  const token = generateSecureToken();
  await prisma.parentalConsentRequest.create({
    data: {
      parentEmail,
      childName,
      token,
      expiresAt: addDays(new Date(), 7)
    }
  });
}

// Verify parent via credit card
async function verifyParentCreditCard(token: string, cardToken: string) {
  // Charge $0.50 using Stripe (refundable)
  const charge = await stripe.charges.create({
    amount: 50, // $0.50
    currency: 'usd',
    source: cardToken,
    description: 'Parental Consent Verification',
    metadata: { consentToken: token }
  });

  // Mark consent as verified
  await prisma.parentalConsentRequest.update({
    where: { token },
    data: {
      verified: true,
      verificationMethod: 'CREDIT_CARD'
    }
  });

  // Refund the charge
  await stripe.refunds.create({ charge: charge.id });
}
```

**Implementation:**
- [ ] Add date of birth field to signup
- [ ] Calculate age and trigger consent flow if <13
- [ ] Create parental consent request system
- [ ] Implement credit card verification (Stripe)
- [ ] Alternative: Government ID upload with manual review
- [ ] Create parental dashboard for child data management
- [ ] Add "View as Parent" feature
- [ ] Implement child account deletion by parent
- [ ] Update privacy policy with COPPA compliance
- [ ] Obtain FTC approval for verification method

**Expected Outcome:** COPPA compliance, legal to serve children

---

### 13. Terms of Service & Privacy Policy
**Severity:** 🔴 CRITICAL | **Impact:** 💥 HIGH | **Effort:** Medium (3-5 days)

**Current State:** No legal documents

**Required Documents:**
1. **Terms of Service**
   - User rights and responsibilities
   - Acceptable use policy
   - Account termination conditions
   - Liability limitations
   - Dispute resolution

2. **Privacy Policy**
   - Data collection practices
   - Data usage and sharing
   - Data retention
   - User rights (GDPR/COPPA)
   - Cookie policy

3. **Cookie Policy**
   - Types of cookies used
   - Purpose of each cookie
   - Opt-out options

**Implementation:**
- [ ] Hire lawyer to draft legal documents
- [ ] Create `/terms` page
- [ ] Create `/privacy` page
- [ ] Create `/cookies` page
- [ ] Add "Agree to Terms" checkbox during signup
- [ ] Implement cookie consent banner
- [ ] Add links to footer on all pages
- [ ] Version legal documents and track changes
- [ ] Notify users of material changes

**Expected Outcome:** Legal protection, user transparency

---

## 🚀 **FEATURE ENHANCEMENTS**

### 14. Automated Testing Suite
**Severity:** 🔴 CRITICAL | **Impact:** 💥 HIGH | **Effort:** High (2-3 weeks)

**Current State:** Zero automated tests

**Recommended Stack:**
- **Jest:** Unit testing
- **React Testing Library:** Component testing
- **Playwright:** E2E testing
- **Supertest:** API testing

**Test Coverage Goals:**
- Unit tests: >80% coverage
- Integration tests: All critical paths
- E2E tests: Happy paths + edge cases

**Implementation:**
```typescript
// Example unit test
describe('calculateGoalProgress', () => {
  it('should calculate progress for simple tasks', async () => {
    const goal = await createTestGoal({
      target: 100,
      taskLinks: [{ task: { type: 'SIMPLE' } }]
    });

    await completeTask(goal.taskLinks[0].taskId);

    const progress = await calculateGoalProgress(goal.id);
    expect(progress).toBe(1);
  });
});

// Example E2E test
test('complete user signup flow', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/verify-email');

  // Get verification code from email mock
  const code = await getLastVerificationCode();
  await page.fill('input[name="code"]', code);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

**Test Categories:**
1. **Unit Tests** (500+ tests)
   - All services (analytics, goal-progress, conditions, etc.)
   - Utility functions (avatar, format, logger)
   - Custom hooks

2. **Integration Tests** (100+ tests)
   - tRPC routers (auth, person, routine, task, etc.)
   - Database operations
   - Authorization middleware

3. **E2E Tests** (50+ tests)
   - User signup/login flow
   - Create person → create routine → complete task
   - Co-parent invitation and acceptance
   - Kiosk mode complete flow
   - Marketplace publishing and forking
   - Billing and subscription

**Implementation:**
- [ ] Set up Jest with TypeScript config
- [ ] Configure React Testing Library
- [ ] Set up Playwright for E2E tests
- [ ] Write unit tests for all services
- [ ] Write integration tests for all routers
- [ ] Write E2E tests for critical user journeys
- [ ] Add test coverage reporting
- [ ] Set up CI/CD to run tests on every commit
- [ ] Require >80% coverage for PRs
- [ ] Create test data factories and fixtures

**Expected Outcome:** Confidence in refactoring, catch bugs early, regression prevention

---

### 15. Real-Time Updates (WebSockets)
**Severity:** 🟡 MEDIUM | **Impact:** 🎯 MEDIUM | **Effort:** Medium (1 week)

**Current State:** Polling every 5 seconds in some places

**Recommended Approach:**
- Use Supabase Realtime for live updates
- Implement tRPC subscriptions
- WebSocket connections for dashboard

**Use Cases:**
- Task completions in kiosk sync to parent dashboard instantly
- Co-parent sees changes in real-time
- Analytics update live as tasks completed
- Notification badges update without refresh

**Implementation:**
```typescript
// Supabase Realtime subscription
import { supabase } from '@/lib/supabase';

// Subscribe to task completions
useEffect(() => {
  const channel = supabase
    .channel('task_completions')
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'task_completions',
        filter: `person_id=eq.${personId}`
      },
      (payload) => {
        // Update UI with new completion
        refetchTasks();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [personId]);
```

**Implementation:**
- [ ] Set up Supabase Realtime subscriptions
- [ ] Add real-time to task completions
- [ ] Add real-time to person/routine updates
- [ ] Add real-time to co-parent activity
- [ ] Implement optimistic updates for better UX
- [ ] Add connection status indicator
- [ ] Handle reconnection logic
- [ ] Test with slow/unstable connections

**Expected Outcome:** Better UX, instant feedback, collaborative feel

---

### 16. Push Notifications
**Severity:** 🟡 MEDIUM | **Impact:** 🎯 MEDIUM | **Effort:** High (1-2 weeks)

**Current State:** No notifications

**Recommended Approach:**
- Web Push API for browser notifications
- Firebase Cloud Messaging (FCM) for mobile
- Email notifications as fallback

**Use Cases:**
- Remind child about incomplete tasks (end of day)
- Notify parent when child completes routine
- Alert co-parent of shared activity
- Notify teacher when student completes work
- Remind to verify email
- Notify of subscription renewal

**Implementation:**
```typescript
// Service Worker for Web Push
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag,
    requireInteraction: data.urgent
  });
});

// Request permission
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Subscribe to push notifications
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
    });

    // Send subscription to backend
    await trpc.notifications.subscribe.mutate({ subscription });
  }
}
```

**Implementation:**
- [ ] Set up service worker for web push
- [ ] Implement notification permission flow
- [ ] Create notification preferences page
- [ ] Add notification triggers to backend
- [ ] Implement email fallback
- [ ] Create notification templates
- [ ] Add notification history
- [ ] Test across browsers (Chrome, Firefox, Safari)
- [ ] Respect quiet hours (e.g., no notifications after 9 PM)

**Expected Outcome:** Better engagement, timely reminders, improved retention

---

### 17. Offline Support (PWA)
**Severity:** 🟡 MEDIUM | **Impact:** 🎯 MEDIUM | **Effort:** High (1-2 weeks)

**Current State:** No offline functionality

**Recommended Approach:**
- Progressive Web App (PWA)
- Service Worker for caching
- IndexedDB for offline data storage
- Queue operations for later sync

**Use Cases:**
- Complete tasks offline (especially in kiosk mode)
- View routines without internet
- App continues to work during network outages
- Faster load times with cached assets

**Implementation:**
```typescript
// Install next-pwa
// npm install next-pwa

// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300 // 5 minutes
        }
      }
    }
  ]
});

module.exports = withPWA({
  // ... other Next.js config
});

// Offline queue
import { openDB } from 'idb';

async function queueOfflineCompletion(taskId: string, personId: string) {
  const db = await openDB('offline-queue');
  await db.add('completions', {
    taskId,
    personId,
    completedAt: new Date(),
    synced: false
  });
}

// Sync when online
window.addEventListener('online', async () => {
  const db = await openDB('offline-queue');
  const pending = await db.getAll('completions');

  for (const completion of pending) {
    try {
      await trpc.task.complete.mutate(completion);
      await db.delete('completions', completion.id);
    } catch (error) {
      // Will retry next time online
    }
  }
});
```

**Implementation:**
- [ ] Configure next-pwa
- [ ] Create app manifest (name, icons, theme color)
- [ ] Implement service worker with caching strategies
- [ ] Set up IndexedDB for offline data
- [ ] Create offline queue for mutations
- [ ] Add sync logic when connection restored
- [ ] Show offline indicator in UI
- [ ] Test offline functionality thoroughly
- [ ] Add "Add to Home Screen" prompt

**Expected Outcome:** Works offline, better reliability, native app feel

---

### 18. Mobile App (React Native)
**Severity:** 🟢 LOW | **Impact:** 💥 HIGH | **Effort:** Very High (2-3 months)

**Current State:** Web-only

**Recommended Approach:**
- Expo for faster development
- Share business logic with web app
- Native features: camera, notifications, biometrics

**Features:**
- Native push notifications
- Offline-first architecture
- Biometric login (Face ID, Touch ID)
- Camera for avatar photos
- Better performance than PWA

**Implementation:**
- [ ] Set up Expo project
- [ ] Extract shared logic to packages (tRPC client, utilities)
- [ ] Build authentication flow
- [ ] Implement main features (persons, routines, tasks)
- [ ] Add native features (camera, biometrics, push)
- [ ] Test on iOS and Android
- [ ] Submit to App Store and Google Play

**Expected Outcome:** Native app experience, better mobile engagement

---

### 19. Advanced Analytics & Insights
**Severity:** 🟡 MEDIUM | **Impact:** 🎯 MEDIUM | **Effort:** High (2 weeks)

**Current State:** Basic charts only

**Recommended Enhancements:**
- **Predictive Analytics**
  - Best times to schedule routines (ML-based)
  - Task completion predictions
  - Streak tracking and predictions

- **Comparative Analytics**
  - Compare child's progress to their own past (not others)
  - Identify improvement trends
  - Highlight areas needing attention

- **Behavioral Insights**
  - Task completion patterns (time of day, day of week)
  - Correlation between tasks (completing A increases likelihood of B)
  - Identify challenging tasks (low completion rate)

- **Goal Recommendations**
  - AI-suggested goals based on behavior
  - Achievable targets based on history
  - Celebrate milestones automatically

**Implementation:**
```typescript
// ML-based time recommendation
import * as tf from '@tensorflow/tfjs';

async function recommendBestTime(taskId: string, personId: string) {
  // Get historical completion data
  const completions = await prisma.taskCompletion.findMany({
    where: { task: { id: taskId }, personId },
    select: { completedAt: true, value: true }
  });

  // Extract features (hour of day, day of week)
  const features = completions.map(c => [
    c.completedAt.getHours(),
    c.completedAt.getDay()
  ]);

  // Simple clustering to find best times
  const clusters = performClustering(features);
  return clusters[0]; // Most common time
}

// Streak calculation
async function calculateStreak(personId: string, routineId: string) {
  const completions = await prisma.taskCompletion.findMany({
    where: {
      personId,
      task: { routineId }
    },
    orderBy: { completedAt: 'desc' }
  });

  let streak = 0;
  let currentDate = new Date();

  for (const completion of completions) {
    const compDate = startOfDay(completion.completedAt);
    const expectedDate = subDays(currentDate, streak);

    if (isSameDay(compDate, expectedDate)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
```

**Implementation:**
- [ ] Add streak tracking to database
- [ ] Calculate and display streaks
- [ ] Implement best time recommendations
- [ ] Create correlation analysis
- [ ] Add comparative charts (this week vs last week)
- [ ] Implement milestone detection
- [ ] Add achievement badges
- [ ] Create weekly summary email

**Expected Outcome:** Better insights, increased engagement, data-driven decisions

---

### 20. Accessibility (WCAG 2.1 AA)
**Severity:** 🟠 HIGH | **Impact:** 🎯 MEDIUM | **Effort:** Medium (1-2 weeks)

**Current State:** Minimal accessibility features

**WCAG Requirements:**
1. **Perceivable**
   - Text alternatives for images (alt text)
   - Captions for video content
   - Color contrast ratio ≥4.5:1

2. **Operable**
   - Keyboard navigation (no mouse required)
   - Focus indicators visible
   - Skip navigation links

3. **Understandable**
   - Clear error messages
   - Consistent navigation
   - Input assistance

4. **Robust**
   - Valid HTML
   - ARIA landmarks and labels
   - Screen reader compatible

**Implementation:**
```typescript
// Add ARIA labels
<Button
  onClick={handleComplete}
  aria-label={`Complete task: ${task.name}`}
  aria-pressed={isComplete}
>
  <CheckIcon aria-hidden="true" />
</Button>

// Add focus management
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

function Modal({ children, onClose }) {
  const modalRef = useFocusTrap();

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
}

// Add skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

**Testing Tools:**
- axe DevTools
- WAVE browser extension
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast analyzer

**Implementation:**
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure all functionality keyboard accessible
- [ ] Add skip navigation links
- [ ] Fix color contrast issues (check with tool)
- [ ] Add focus indicators (outline visible)
- [ ] Test with screen readers
- [ ] Create accessibility statement page
- [ ] Add keyboard shortcuts (with visible help)
- [ ] Implement reduced motion preference
- [ ] Add high contrast mode option

**Expected Outcome:** Accessible to users with disabilities, legal compliance

---

## 🎨 **USER EXPERIENCE**

### 21. Onboarding Flow
**Severity:** 🟡 MEDIUM | **Impact:** 💥 HIGH | **Effort:** Medium (1 week)

**Current State:** No onboarding

**Recommended Flow:**
1. Welcome screen explaining Ruby Routines
2. Role selection (Parent or Teacher)
3. Create first person (guided)
4. Create first routine (template selection)
5. Add first task (with tips)
6. Complete first task (celebration)
7. Optional: Tour of features

**Implementation:**
- [ ] Create onboarding pages
- [ ] Add progress indicator (step 1 of 7)
- [ ] Create routine templates (morning, bedtime, homework)
- [ ] Add helpful tooltips
- [ ] Allow skip onboarding
- [ ] Track onboarding completion
- [ ] A/B test different flows

**Expected Outcome:** Better user activation, reduced churn

---

### 22. Multi-Language Support (i18n)
**Severity:** 🟡 MEDIUM | **Impact:** 🎯 MEDIUM | **Effort:** High (2-3 weeks)

**Current State:** English only

**Recommended Languages:**
- Spanish (US + Latin America)
- French (Canada + France)
- Mandarin Chinese
- German
- Portuguese (Brazil)

**Implementation:**
```typescript
// Install: npm install next-intl

// messages/en.json
{
  "dashboard": {
    "welcome": "Welcome back, {name}!",
    "tasks": {
      "complete": "Complete Task",
      "undo": "Undo"
    }
  }
}

// Usage
import { useTranslations } from 'next-intl';

function Dashboard() {
  const t = useTranslations('dashboard');

  return <h1>{t('welcome', { name: user.name })}</h1>;
}
```

**Implementation:**
- [ ] Set up next-intl
- [ ] Extract all strings to translation files
- [ ] Translate to target languages (hire translators)
- [ ] Add language selector to settings
- [ ] Test right-to-left languages (Arabic, Hebrew)
- [ ] Handle date/number formatting per locale
- [ ] Translate email templates
- [ ] Update SEO for each language

**Expected Outcome:** Global reach, better engagement in non-English markets

---

### 23. Dark Mode
**Severity:** 🟢 LOW | **Impact:** 🎯 MEDIUM | **Effort:** Medium (3-5 days)

**Current State:** Light mode only

**Implementation:**
```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      }
    }
  }
};

// Add dark mode toggle
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

**Implementation:**
- [ ] Configure Tailwind for dark mode
- [ ] Add dark mode CSS variables
- [ ] Update all components with dark mode styles
- [ ] Add theme toggle to settings
- [ ] Respect system preference
- [ ] Test contrast in dark mode
- [ ] Update D3.js charts for dark mode

**Expected Outcome:** Better UX, reduced eye strain, modern feel

---

## 📈 **PERFORMANCE & SCALABILITY**

### 24. Database Optimization
**Severity:** 🟠 HIGH | **Impact:** 💥 HIGH | **Effort:** Medium (1 week)

**Current State:** Basic indexing only

**Recommended Optimizations:**
1. **Indexes**
   - Add composite indexes for common queries
   - Index foreign keys
   - Index frequently filtered columns

2. **Query Optimization**
   - Fix remaining N+1 queries
   - Use select to fetch only needed fields
   - Implement cursor-based pagination

3. **Caching**
   - Redis for frequently accessed data
   - Edge caching for static content
   - API response caching

**Implementation:**
```sql
-- Add composite indexes
CREATE INDEX idx_task_completions_person_date
  ON task_completions(person_id, completed_at DESC);

CREATE INDEX idx_routines_role_status
  ON routines(role_id, status);

CREATE INDEX idx_tasks_routine_status
  ON tasks(routine_id, status);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE routine_id = '...' AND status = 'ACTIVE';
```

**Implementation:**
- [ ] Analyze slow queries with Prisma logging
- [ ] Add indexes for slow queries
- [ ] Set up Redis for caching
- [ ] Cache analytics calculations (5-min TTL)
- [ ] Implement cursor pagination on large lists
- [ ] Use Prisma.$queryRaw for complex queries
- [ ] Set up database connection pooling
- [ ] Monitor query performance with Datadog

**Expected Outcome:** Faster queries, better scalability, reduced costs

---

### 25. CDN & Asset Optimization
**Severity:** 🟡 MEDIUM | **Impact:** 🎯 MEDIUM | **Effort:** Low (2-3 days)

**Current State:** Vercel default CDN

**Recommended Enhancements:**
- CloudFlare CDN for global distribution
- Image optimization (Next.js Image component)
- WebP/AVIF image formats
- Code splitting and lazy loading
- Bundle size optimization

**Implementation:**
```typescript
// Use Next.js Image
import Image from 'next/image';

<Image
  src="/avatar.png"
  alt="User avatar"
  width={48}
  height={48}
  loading="lazy"
  placeholder="blur"
/>

// Dynamic imports for large components
const AnalyticsChart = dynamic(() => import('@/components/analytics/CompletionChart'), {
  loading: () => <Skeleton />,
  ssr: false // Don't render on server (D3.js)
});

// Bundle analysis
// npm run build -- --analyze
```

**Implementation:**
- [ ] Replace `<img>` with Next.js `<Image>`
- [ ] Convert images to WebP/AVIF
- [ ] Implement lazy loading for below-fold content
- [ ] Code split routes and large components
- [ ] Analyze bundle size, remove unused dependencies
- [ ] Enable compression (gzip/brotli)
- [ ] Set up CloudFlare for global CDN
- [ ] Configure aggressive caching for static assets

**Expected Outcome:** Faster page loads, better global performance, reduced bandwidth

---

## 🔮 **FUTURE INNOVATIONS**

### 26. AI-Powered Features
**Severity:** 🟢 LOW | **Impact:** 💥 HIGH | **Effort:** Very High (3-6 months)

**Potential Features:**
1. **Smart Task Suggestions**
   - AI suggests tasks based on age, goals, behavior

2. **Natural Language Task Creation**
   - "Add morning routine with brushing teeth, making bed, eating breakfast"

3. **Intelligent Scheduling**
   - AI optimizes routine timing based on completion patterns

4. **Behavioral Insights**
   - AI identifies patterns and provides actionable insights

5. **Voice Assistant Integration**
   - "Alexa, mark morning routine as complete"

**Implementation:**
- [ ] Integrate OpenAI API for NLP
- [ ] Train custom model on routine/task data
- [ ] Implement voice recognition (Web Speech API)
- [ ] Create Alexa skill / Google Assistant action
- [ ] Add AI chat assistant for help

**Expected Outcome:** Cutting-edge features, competitive advantage

---

### 27. Social Features (Optional)
**Severity:** 🟢 LOW | **Impact:** 🎯 MEDIUM | **Effort:** High (2-3 weeks)

**Potential Features:**
- Share achievements (opt-in, privacy-focused)
- Family leaderboards (non-competitive)
- Template sharing between users
- Community forums

**Note:** Must be carefully designed to maintain non-competitive philosophy

---

### 28. Gamification (Non-Competitive)
**Severity:** 🟢 LOW | **Impact:** 🎯 MEDIUM | **Effort:** Medium (1-2 weeks)

**Features:**
- Achievement badges (personal milestones)
- Sticker collection (complete tasks to earn stickers)
- Customizable avatars (unlock items)
- Celebration animations (more variety)
- Virtual rewards (stars, coins for completing tasks)

**Important:** No comparisons to other users, only self-improvement

---

## 📊 **SECURITY GRADE ROADMAP**

### Current Grade: B+
**To Achieve A-:**
- ✅ Implement Rate Limiting (CRITICAL)
- ✅ Add Security Headers & CSP (HIGH)
- ✅ Deploy Supabase RLS Policies (CRITICAL)
- ✅ Comprehensive Audit Logging (HIGH)
- ✅ Automated Security Scanning (HIGH)

### To Achieve A:
- ✅ Penetration Testing (bi-annual)
- ✅ Two-Factor Authentication (2FA)
- ✅ Advanced Monitoring & Alerting
- ✅ Security Incident Response Plan
- ✅ Regular Security Training

### To Achieve A+:
- ✅ Bug Bounty Program
- ✅ SOC 2 Compliance
- ✅ ISO 27001 Certification
- ✅ Dedicated Security Team
- ✅ Zero-trust architecture

---

## 🎯 **RECOMMENDED IMPLEMENTATION ORDER**

### Phase 1: Security Hardening (2-3 weeks)
1. Rate Limiting Implementation
2. Security Headers & CSP
3. Supabase RLS Policies
4. Audit Logging
5. Automated Security Scanning

**Target:** Security Grade A-

### Phase 2: Compliance (3-4 weeks)
6. GDPR Compliance
7. COPPA Compliance
8. Terms of Service & Privacy Policy
9. Secrets Management
10. Enhanced Password Security

**Target:** Legal compliance, reduced liability

### Phase 3: Quality Assurance (2-3 weeks)
11. Automated Testing Suite
12. Accessibility (WCAG 2.1 AA)
13. Performance Optimization
14. Monitoring & Alerting

**Target:** Production-ready, high quality

### Phase 4: Feature Enhancements (4-6 weeks)
15. Real-Time Updates
16. Push Notifications
17. Offline Support (PWA)
18. Advanced Analytics
19. Onboarding Flow

**Target:** Better UX, increased engagement

### Phase 5: Growth (Ongoing)
20. Multi-Language Support
21. Mobile App (React Native)
22. AI-Powered Features
23. Continuous Security Improvements

**Target:** Market expansion, innovation

---

## 💰 **ESTIMATED COSTS**

### Security & Compliance
- Penetration Testing: $5,000-$15,000 (annual)
- Legal Documents: $2,000-$5,000 (one-time)
- Bug Bounty Platform: $500/month + rewards
- Security Scanning Tools: $200-$500/month
- SSL Certificates: $0 (Let's Encrypt)

### Infrastructure
- Upstash Redis (rate limiting): $10-$50/month
- Datadog/Sentry: $50-$200/month
- CDN (CloudFlare): $20-$100/month
- Backups & Monitoring: $20-$50/month

### Development
- Contractor/Developer Time: $5,000-$20,000/month
- Testing & QA: $2,000-$5,000/month
- Translations: $50-$200 per language

### Total Monthly Recurring: ~$300-$1,200
### Total One-Time: ~$10,000-$30,000

---

## 📝 **CONCLUSION**

This document provides a comprehensive roadmap for improving Ruby Routines from its current **B+ security posture to A-**, implementing critical compliance requirements, and adding valuable features to increase user engagement and market competitiveness.

**Priority recommendations for next 3 months:**
1. ✅ Security hardening (rate limiting, RLS, headers, audit logging)
2. ✅ Compliance implementation (GDPR, COPPA, legal documents)
3. ✅ Automated testing suite
4. ✅ Accessibility improvements
5. ✅ Real-time updates and push notifications

By implementing these recommendations systematically, Ruby Routines will achieve **enterprise-grade security**, **legal compliance**, and **feature parity** with leading competitors in the routine management space.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Next Review:** 2025-12-13

