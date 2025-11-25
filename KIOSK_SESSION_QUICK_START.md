# Kiosk Session Management - Quick Start Guide

## 🎯 What Was Implemented

A complete backend system for managing kiosk sessions with:
- **10-minute code expiration** - Codes can only create NEW sessions within 10 minutes
- **90-day session duration** - Once created, sessions last 90 days
- **One code = one device** - Each code entry creates a single session
- **Session tracking** - IP address, user agent, start/end times
- **Session termination** - Manual or automatic session ending
- **Tier limits** - Enforce limits on active kiosk codes

## 📊 Architecture

```
Code Generation (Admin)
  ↓
Code Valid for 10 Minutes
  ↓
User Enters Code on Device
  ↓
Session Created (90-day duration)
  ↓
Heartbeat Every 30 Seconds
  ↓
Session Active Until:
  - 90 days pass (auto-expire)
  - User terminates manually
  - Admin terminates
```

## 🗄️ Database Schema

### New Table: kiosk_sessions
- `id` - Unique session identifier
- `codeId` - Links to the code used
- `deviceId` - Unique device identifier
- `startedAt` - When session began
- `lastActiveAt` - Last heartbeat timestamp
- `expiresAt` - When session expires (90 days)
- `endedAt` - When session was terminated
- `ipAddress` - Device IP address
- `userAgent` - Device browser info
- `terminatedBy` - User who ended session
- `terminatedAt` - When terminated
- `terminationReason` - Why terminated

### Updated Table: codes
- Added: `sessionDurationDays` (default: 90)
- Added: `sessions` relation (one-to-many)

## 🔌 API Endpoints

### Public Endpoints (No Auth Required)
```typescript
// Create session when code is entered
kiosk.createSession({ codeId, deviceId })

// Keep session alive (heartbeat)
kiosk.updateSessionActivity({ sessionId })

// Validate session is still active
kiosk.validateSession({ sessionId })
```

### Protected Endpoints (Auth Required)
```typescript
// Get all active sessions for user's role
kiosk.getActiveSessions({ roleId })

// Get session count for a code
kiosk.getSessionCount({ codeId })

// Terminate a specific session
kiosk.terminateSession({ sessionId, reason? })

// Terminate all sessions for a code
kiosk.terminateAllSessions({ codeId, reason? })
```

## 📁 Files Changed

### ✅ Created
1. `prisma/migrations/20251125000000_add_kiosk_sessions/migration.sql`
2. `lib/services/kiosk-session.ts` (385 lines)
3. `KIOSK_SESSION_IMPLEMENTATION_REPORT.md`

### ✅ Modified
1. `prisma/schema.prisma` - Added KioskSession model, updated Code model
2. `lib/services/kiosk-code.ts` - Changed to 10-minute expiration
3. `lib/trpc/routers/kiosk.ts` - Added 7 session endpoints

## 🎨 Frontend TODO

### Priority 1: Core Session Flow
1. **Update kiosk/[code]/page.tsx**
   - Create session on code entry
   - Implement 30-second heartbeat
   - Validate session on mount
   - Handle session termination

### Priority 2: Session Display
2. **Create components/kiosk/session-indicator.tsx**
   - Badge showing active session count
   - Refreshes every 30 seconds

3. **Create components/kiosk/my-kiosk-sessions.tsx**
   - Table of all active sessions
   - Terminate session actions
   - Live duration counters

### Priority 3: Management Page
4. **Create app/(dashboard)/kiosk-sessions/page.tsx**
   - Full sessions dashboard
   - Filter/sort capabilities
   - Bulk actions

### Priority 4: Updates
5. **Update components/kiosk/kiosk-code-manager.tsx**
   - Change button text to "Generate Code and Initiate Session"
   - Update expiration from hours to minutes
   - Add session count indicator

## 🚀 How to Use (Backend)

### Generate a Code
```typescript
const code = await generateKioskCode({
  roleId: 'user-role-id',
  userName: 'John',
  wordCount: 3,
  expiresInMinutes: 10, // NEW: Code expires in 10 mins
  sessionDurationDays: 90 // Sessions last 90 days
});
```

### Create Session (Device Side)
```typescript
const session = await createKioskSession({
  codeId: 'code-id',
  deviceId: 'unique-device-id',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  durationDays: 90
});
```

### Heartbeat (Keep Alive)
```typescript
// Call every 30 seconds
await updateSessionActivity(sessionId);
```

### Terminate Session
```typescript
// By user
await terminateSession(sessionId, userId, 'User logged out');

// All for a code
await terminateAllSessionsForCode(codeId, userId, 'Code revoked');
```

### Check Session Status
```typescript
const result = await validateSession(sessionId);
if (!result.valid) {
  // Session expired or terminated
  console.log(result.error);
}
```

## 🔧 Configuration

### Session Duration (Default: 90 days)
Set per-code or via admin settings:
```typescript
// Admin settings (future)
kiosk_session_duration_days: 90

// Or per-code generation
generateKioskCode({
  ...options,
  sessionDurationDays: 30 // Override default
});
```

### Code Expiration (Default: 10 minutes)
```typescript
generateKioskCode({
  ...options,
  expiresInMinutes: 5 // Shorter window
});
```

### Heartbeat Frequency (Recommended: 30 seconds)
```typescript
// In kiosk mode page
useEffect(() => {
  const interval = setInterval(() => {
    heartbeat.mutate({ sessionId });
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [sessionId]);
```

## 📋 Testing Checklist

- [ ] Generate code from admin
- [ ] Code expires after 10 minutes
- [ ] Enter valid code creates session
- [ ] Enter expired code shows error
- [ ] Session lasts 90 days
- [ ] Heartbeat updates lastActiveAt
- [ ] Session terminates manually
- [ ] Session auto-expires after 90 days
- [ ] Session count displays correctly
- [ ] IP address captured
- [ ] User agent captured
- [ ] Tier limits enforced

## 🐛 Common Issues

### Session Not Creating
- Check code hasn't expired (10-minute window)
- Check code status is ACTIVE
- Check deviceId is unique

### Session Terminating Early
- Check heartbeat is running every 30 seconds
- Check session expiration date
- Check if manually terminated

### Session Count Wrong
- Refresh query cache
- Check for expired sessions
- Run cleanup job

## 🔐 Security Notes

1. **IP Address** - Captured from headers (x-forwarded-for, x-real-ip)
2. **Device ID** - Should be unique per device (use fingerprinting)
3. **Session Validation** - Always validate before sensitive operations
4. **Termination** - Requires ownership verification

## 📞 Support

See `KIOSK_SESSION_IMPLEMENTATION_REPORT.md` for:
- Complete implementation details
- Full API documentation
- Frontend component guidelines
- Migration instructions
- Testing recommendations

## ⚡ Quick Commands

```bash
# Generate Prisma client
npx prisma generate

# Apply migration (dev)
npx prisma migrate dev

# Apply migration (prod)
npx prisma migrate deploy

# View sessions in DB
npx prisma studio
```

## 📈 Monitoring

### Active Sessions Query
```sql
SELECT
  s.id,
  s.startedAt,
  s.expiresAt,
  s.lastActiveAt,
  s.ipAddress,
  c.code,
  p.name as person_name
FROM kiosk_sessions s
JOIN codes c ON s.codeId = c.id
LEFT JOIN persons p ON c.personId = p.id
WHERE s.endedAt IS NULL
  AND s.expiresAt > NOW()
ORDER BY s.startedAt DESC;
```

### Session Count by Code
```sql
SELECT
  c.code,
  COUNT(s.id) as active_sessions
FROM codes c
LEFT JOIN kiosk_sessions s ON s.codeId = c.id
  AND s.endedAt IS NULL
  AND s.expiresAt > NOW()
WHERE c.type = 'KIOSK'
GROUP BY c.id, c.code
ORDER BY active_sessions DESC;
```

---

**Version:** 1.0
**Date:** 2025-11-25
**Status:** Backend Complete, Frontend Pending
