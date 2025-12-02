# Security Audit Report

**Date**: 2025-11-30
**Scope**: Pre-deployment security audit
**Repository**: /Users/ahmetrasit/rubyroutines

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 5 |
| Low | 4 |
| **Total** | **13** |

---

## Critical Findings

### 1. Hardcoded Secrets in .env File Committed to Repository

**File**: `/Users/ahmetrasit/rubyroutines/.env`
**Lines**: 6-52

**Description**: The `.env` file contains real production credentials and is present in the repository. While `.env` is listed in `.gitignore`, the file exists with actual secrets:

- Database credentials with password: `kids-run-fast` (lines 6, 9, 12-20)
- Supabase service role key (line 27)
- NextAuth secret (line 31)
- Google OAuth client secret (line 36)
- Resend API key (line 39)
- Two-factor encryption key (line 52)

**Risk**: Complete account compromise if repository is exposed; attackers can access database, impersonate users, read/send emails.

---

## High Severity Findings

### 2. sendVerificationCode Endpoint Lacks User Ownership Validation

**File**: `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/auth.ts`
**Lines**: 354-378

**Description**: The `sendVerificationCode` procedure uses `publicProcedure` and accepts arbitrary `userId` and `email` parameters without validating that they correspond to each other or that the caller has any relationship to them.

```typescript
sendVerificationCode: publicProcedure
  .input(z.object({
    userId: z.string(),
    email: z.string().email(),
  }))
```

**Risk**: An attacker could enumerate user IDs and trigger verification emails to any address, potentially used for spam or phishing.

---

### 3. Invitation Token Exposure in Public Endpoint

**File**: `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/invitation.ts`
**Lines**: 8-45

**Description**: The `getByToken` endpoint exposes sensitive invitation details (inviter name, email, permissions) to anyone with the token, which is transmitted via URL.

```typescript
getByToken: publicProcedure
  .input(z.object({ token: z.string() }))
```

**Risk**: Invitation tokens in URLs may be logged in server logs, browser history, or analytics. No rate limiting on this endpoint allows token enumeration.

---

### 4. CSP Allows 'unsafe-eval' and 'unsafe-inline'

**File**: `/Users/ahmetrasit/rubyroutines/next.config.js`
**Lines**: 68-80

**Description**: Content Security Policy includes `'unsafe-eval'` and `'unsafe-inline'` for scripts:

```javascript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
"style-src 'self' 'unsafe-inline'",
```

**Risk**: Weakens XSS protection significantly. If an XSS vulnerability exists, these directives allow attackers to execute arbitrary JavaScript.

---

## Medium Severity Findings

### 5. Raw SQL Queries with Template Literals (Parameterized - Verified Safe)

**File**: `/Users/ahmetrasit/rubyroutines/lib/services/task-completion-coordinated.ts`
**Lines**: 87-94, 170-177, 271-281

**Description**: Uses `$queryRaw` with template literals. While Prisma's tagged template literals are safe (parameterized), this pattern requires ongoing vigilance:

```typescript
const existing = await tx.$queryRaw<Array<{ id: string }>>`
  SELECT id FROM "task_completions"
  WHERE "taskId" = ${input.taskId}
    AND "personId" = ${input.personId}
```

**Risk**: Currently safe due to Prisma's parameterization, but developers unfamiliar with this may introduce SQL injection if they switch to string concatenation.

---

### 6. In-Memory Rate Limiter in Production Warning

**File**: `/Users/ahmetrasit/rubyroutines/lib/rate-limit.ts`
**Lines**: 26-40

**Description**: The rate limiter falls back to in-memory storage when Redis is not configured, with only a console warning in production:

```typescript
if (process.env.NODE_ENV === 'production' && !this.hasWarned) {
  console.warn('WARNING: Using in-memory rate limiter in production...');
}
```

**Risk**: In-memory rate limiting does not work across multiple server instances and resets on deployment, allowing rate limit bypass.

---

### 7. Weak Password Requirements

**File**: `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/auth.ts`
**Line**: 35

**Description**: Password minimum length is only 6 characters:

```typescript
password: z.string().min(6, 'Password must be at least 6 characters'),
```

**Risk**: Modern security standards recommend 8-12 character minimums with complexity requirements.

---

### 8. CORS Wildcard in Development May Leak to Production

**File**: `/Users/ahmetrasit/rubyroutines/next.config.js`
**Lines**: 129-146

**Description**: Development CORS configuration uses wildcard origin:

```javascript
const apiCorsHeaders = isDev ? [
  { key: 'Access-Control-Allow-Origin', value: '*' },
  ...
]
```

**Risk**: If `NODE_ENV` is misconfigured, wildcard CORS could be applied in production, enabling cross-site request attacks.

---

### 9. Missing Rate Limiting on Kiosk Code Validation

**File**: `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/kiosk.ts`
**Lines**: 148-197

**Description**: The `validateCode` endpoint has rate limiting but uses IP fallback which can be spoofed or shared (NAT):

```typescript
validateCode: kioskSessionRateLimitedProcedure
  .input(z.object({ code: z.string().min(1) }))
```

**Risk**: Kiosk codes are short word combinations that could be brute-forced from shared IP ranges.

---

## Low Severity Findings

### 10. Error Messages May Reveal System Information

**File**: `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/auth.ts`
**Lines**: 50-66

**Description**: Error messages contain specific hints about validation failures:

```typescript
if (error.message.includes('password')) {
  message = 'Password is too weak...';
} else if (error.message.includes('email')) {
  message = 'Invalid email address...';
}
```

**Risk**: Differentiated error messages can help attackers enumerate valid accounts or understand validation rules.

---

### 11. Missing Middleware Protection for /api Routes

**File**: `/Users/ahmetrasit/rubyroutines/middleware.ts`
**Line**: 103

**Description**: The middleware matcher explicitly excludes `/api` routes:

```typescript
'/((?!_next/static|_next/image|favicon.ico|api|auth/callback|...'
```

**Risk**: API routes bypass session refresh logic, which may cause session handling inconsistencies.

---

### 12. Development Logging of Verification Codes

**File**: `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/auth.ts`
**Lines**: 372-375, 448-452

**Description**: Verification codes are logged to console in development mode:

```typescript
if (process.env.NODE_ENV === 'development') {
  logger.debug('Verification code generated', { email: input.email, code });
}
```

**Risk**: If development logs are accidentally exposed or `NODE_ENV` is misconfigured, codes could leak.

---

### 13. Blog Content Not Sanitized for Markdown Rendering

**File**: `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/blog.ts`
**Lines**: 242-277 (create), 282-342 (update)

**Description**: Blog content is stored and returned without sanitization. If rendered with `react-markdown`, some XSS vectors may still exist depending on configuration.

```typescript
content: z.string().min(1),
```

**Risk**: Admin-only endpoint reduces risk, but if admin account is compromised, malicious content could be injected.

---

## Security Controls Verified (Positive Findings)

### Authentication
- Login rate limiting: 5 attempts per 15 minutes
- Failed login tracking with progressive lockout (15 minutes after 5 failures)
- Password reset doesn't reveal if email exists (prevents enumeration)
- 2FA implementation with TOTP and encrypted backup codes
- Banned user check on login

### Admin Protection
- All admin routers use `adminProcedure` which verifies `isAdmin` flag
- Admin procedures: `admin-users.ts`, `admin-settings.ts`, `admin-audit.ts`, `admin-marketplace.ts`, `admin-moderation.ts`, `admin-moderation-logs.ts`, `admin-tiers.ts`, `blog.ts` (admin operations)

### Authorization
- Role ownership verification via `verifyRoleOwnership()`
- Person ownership verification via `verifyPersonOwnership()`
- Routine ownership verification via `verifyRoutineOwnership()`
- Task ownership verification via `verifyTaskOwnership()`
- Permission-based access control for shared resources

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- Verification endpoints: 3 requests per hour
- Kiosk endpoints: Tiered limits (SESSION: 100/hr, CODE: 50/hr, IP: 20/hr)
- General API: 100 requests per minute

### Security Headers
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- HSTS in production

### Data Protection
- Verification codes hashed with bcrypt
- 2FA secrets encrypted at rest
- Soft delete for GDPR compliance
- Audit logging for sensitive operations

### No File Upload Handling
- No file upload endpoints found in the codebase

### No XSS via dangerouslySetInnerHTML
- No usage of `dangerouslySetInnerHTML` found in application code

---

## Recommendations Priority

1. **Immediate**: Rotate all exposed secrets and ensure `.env` is never committed
2. **Before Launch**: Add ownership validation to `sendVerificationCode`
3. **Before Launch**: Add rate limiting to invitation token lookup
4. **Before Launch**: Configure Redis for production rate limiting
5. **Short-term**: Strengthen password requirements (8+ characters, complexity)
6. **Medium-term**: Remove `unsafe-eval` and `unsafe-inline` from CSP if possible
