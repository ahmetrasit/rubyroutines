# Dead Code Detection Report

**Date:** 2024-11-30
**Status:** AUDIT ONLY - No fixes applied

---

## Executive Summary

| Category | Count | Safe to Remove | Needs Review | Keep |
|----------|-------|---------------|--------------|------|
| Unused Exports | 14 | 8 | 4 | 2 |
| Unused Types/Interfaces | 4 | 2 | 2 | 0 |
| Commented Code | 4 | 2 | 2 | 0 |
| Unused Dependencies | 1 | 0 | 1 | 0 |
| Orphaned Files | 6 | 3 | 3 | 0 |

**Total Findings:** 29 items

---

## 1. Unused Exports

### 1.1 lib/utils/format.ts - Unused Functions

| Function | Line | Confidence | Recommendation |
|----------|------|------------|----------------|
| `formatRelativeTime` | 102 | HIGH | Safe to remove |
| `formatTaskType` | 151 | HIGH | Safe to remove |
| `formatRoutineType` | 170 | HIGH | Safe to remove |
| `formatDaysOfWeek` | 217 | HIGH | Safe to remove |
| `formatNumber` | 189 | HIGH | Safe to remove |
| `formatDateTime` | 84 | HIGH | Safe to remove |
| `pluralize` | 242 | HIGH | Safe to remove |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/utils/format.ts`

**Note:** These formatting utilities are exported but never imported anywhere in the codebase. The only function from this file being used is `formatDate` (in `lib/services/visibility-rules.ts`).

---

### 1.2 lib/utils/avatar.ts - Unused Functions

| Function/Export | Line | Confidence | Recommendation |
|-----------------|------|------------|----------------|
| `isValidAvatarColor` | 157 | HIGH | Safe to remove |
| `generateRandomAvatar` | 166 | HIGH | Safe to remove |
| `COMMON_EMOJIS` | 14 | HIGH | Safe to remove |
| `PASTEL_COLORS` | 11 | HIGH | Safe to remove |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/utils/avatar.ts`

**Note:** Only `parseAvatar`, `serializeAvatar`, and `getAvatarBackgroundColor` are used externally.

---

### 1.3 lib/hooks - Unused Hooks

| Hook | File | Confidence | Recommendation |
|------|------|------------|----------------|
| `useMutationWithToast` | useWMutationWithToast.ts | HIGH | Needs review - may be intended for future use |
| `useRoleOwnership` | useRoleOwnership.ts | HIGH | Needs review - exported but only used internally |
| `useAuthGuard` | useAuthGuard.ts | HIGH | Needs review - may be intended for future use |
| `useRetryMutation` | use-retry-mutation.ts | HIGH | **Safe to remove** - never imported |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/hooks/`

---

### 1.4 lib/services - Unused Services

| Service | File | Confidence | Recommendation |
|---------|------|------------|----------------|
| `analyzeRoutineUsagePatterns` | condition-optimizer.service.ts | HIGH | **Safe to remove** - never imported |
| `suggestConditionSimplifications` | condition-optimizer.service.ts | HIGH | **Safe to remove** - never imported |
| `recommendGoals` | goal-recommendation.service.ts | HIGH | **Safe to remove** - never imported |
| `identifyCompletionPatterns` | goal-recommendation.service.ts | HIGH | **Safe to remove** - never imported |
| `diagnoseRealtime` | realtime-diagnostics.ts | MEDIUM | Keep - debugging utility |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/services/`

**Note:** `condition-optimizer.service.ts` (408 lines) and `goal-recommendation.service.ts` (454 lines) are entire files that are never imported. These appear to be planned features that were never integrated.

---

## 2. Unused TypeScript Types/Interfaces

### 2.1 lib/types/database.ts

| Type | Line | Confidence | Recommendation |
|------|------|------------|----------------|
| `SchoolWithMembers` | 336 | HIGH | Safe to remove |
| `SchoolMember` | 334 | HIGH | Safe to remove |
| `TaskCompletionStats` | 413 | MEDIUM | Needs review - may be used in future |
| `RoutineCompletionStats` | 420 | MEDIUM | Needs review - may be used in future |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/types/database.ts`

---

### 2.2 lib/types/prisma-enums.ts

| Type | Line | Confidence | Recommendation |
|------|------|------------|----------------|
| `NotificationType` | 167 | HIGH | Needs review - matches commented notification feature |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/types/prisma-enums.ts`

---

## 3. Commented-Out Code Blocks

### 3.1 Disabled Features

| File | Line | Description | Recommendation |
|------|------|-------------|----------------|
| `lib/trpc/routers/_app.ts` | 29 | `// import { notificationRouter } from './notification';` | Needs review - planned feature |
| `lib/trpc/routers/_app.ts` | 59 | `// notification: notificationRouter, // Disabled: Notification table not in schema yet` | Needs review - planned feature |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/_app.ts`

---

### 3.2 Example Files

| File | Line | Description | Recommendation |
|------|------|-------------|----------------|
| `lib/hooks/examples/optimistic-usage.example.tsx` | 267 | Commented import | Safe to remove - example file |

**Location:** `/Users/ahmetrasit/rubyroutines/lib/hooks/examples/`

**Note:** The entire `optimistic-usage.example.tsx` file is never imported and serves only as documentation.

---

### 3.3 TODO Comments (Incomplete Features)

| File | Line | TODO | Priority |
|------|------|------|----------|
| `app/saved-routines/page.tsx` | 37 | `// TODO: Implement saved routines query` | HIGH - Page shows placeholder |
| `app/marketplace/[id]/page.tsx` | 96 | `// TODO: Add target selection UI` | MEDIUM |
| `components/routine/RoutineActionsModal.tsx` | 100 | `// TODO: Implement publish to community routines` | LOW |
| `components/condition/condition-list.tsx` | 285 | `// TODO: Call API to persist new order` | MEDIUM |
| `app/settings/support/page.tsx` | 24 | `// TODO: Implement actual support ticket submission` | LOW |
| `app/settings/account/page.tsx` | 46 | `// TODO: Implement profile update mutation` | MEDIUM |

---

## 4. Unused Dependencies

### 4.1 package.json Analysis

| Package | Type | Confidence | Recommendation |
|---------|------|------------|----------------|
| `react-cookie-consent` | dependency | HIGH | **Needs review** - Custom implementation exists |

**Location:** `/Users/ahmetrasit/rubyroutines/package.json` (line 56)

**Analysis:** The package `react-cookie-consent` is listed as a dependency but the codebase uses a custom `CookieConsent` component at `/Users/ahmetrasit/rubyroutines/components/cookie-consent.tsx` that does not use this package.

### 4.2 Dependencies That ARE Used

The following were verified as being used:
- `@dnd-kit/*` - Used in `components/condition/condition-list.tsx`
- `react-colorful` - Used in color picker components
- `react-markdown` - Used in blog pages
- `recharts` - Used in analytics (through d3)
- `d3` - Used in analytics charts
- `qrcode` / `speakeasy` - Used in two-factor.ts (dynamic require)
- `next-pwa` - Used in next.config.js
- `emoji-picker-react` - Used in icon-emoji-picker.tsx

---

## 5. Orphaned Files

### 5.1 Example/Documentation Files

| File | Size | Confidence | Recommendation |
|------|------|------------|----------------|
| `lib/hooks/examples/optimistic-usage.example.tsx` | ~300 lines | HIGH | Safe to remove or move to docs |
| `lib/utils/realtime-diagnostics.ts` | ~100 lines | MEDIUM | Keep - useful debugging tool |

---

### 5.2 Duplicate/Legacy Hooks Directory

| File | Size | Confidence | Recommendation |
|------|------|------------|----------------|
| `hooks/use-page-visibility.ts` | 50 lines | HIGH | **Safe to remove** - never imported |
| `hooks/use-picker-state.ts` | 47 lines | HIGH | **Safe to remove** - never imported |
| `hooks/use-realtime-routines.ts` | 36 lines | HIGH | **Safe to remove** - never imported |
| `hooks/use-realtime-tasks.ts` | 36 lines | HIGH | **Safe to remove** - never imported |

**Location:** `/Users/ahmetrasit/rubyroutines/hooks/`

**Note:** There's a separate `hooks/` directory at the root level that contains 5 hook files. Only `use-realtime-task-completions.ts` is actually imported (in kiosk pages). The other 4 files are completely orphaned.

---

### 5.3 Preview/Demo Pages

| File | Description | Confidence | Recommendation |
|------|-------------|------------|----------------|
| `app/checkin-preview/page.tsx` | UI design preview page | MEDIUM | Needs review - development tool |

**Location:** `/Users/ahmetrasit/rubyroutines/app/checkin-preview/`

**Note:** This page is not linked from anywhere in the application but may be useful for design review. Consider whether it should be protected or removed before production.

---

### 5.4 Unused UI Components

| Component | File | Confidence | Recommendation |
|-----------|------|------------|----------------|
| `Form`, `FormField`, etc. | components/ui/form.tsx | HIGH | **Safe to remove** - never imported |

**Location:** `/Users/ahmetrasit/rubyroutines/components/ui/form.tsx`

**Note:** This appears to be a shadcn/ui form component that was added but never integrated.

---

## 6. Summary of Removable Code

### Safe to Remove (High Confidence)

**Estimated lines of removable code: ~1,500 lines**

1. **lib/utils/format.ts** - Remove unused functions (keep `formatDate`, `formatResetPeriod`, `formatVisibility`, `formatPercentage`, `truncate`): ~100 lines
2. **lib/utils/avatar.ts** - Remove unused exports: ~50 lines
3. **lib/hooks/use-retry-mutation.ts** - Entire file: ~100 lines
4. **lib/services/condition-optimizer.service.ts** - Entire file: ~408 lines
5. **lib/services/goal-recommendation.service.ts** - Entire file: ~454 lines
6. **hooks/use-page-visibility.ts** - Entire file: ~50 lines
7. **hooks/use-picker-state.ts** - Entire file: ~47 lines
8. **hooks/use-realtime-routines.ts** - Entire file: ~36 lines
9. **hooks/use-realtime-tasks.ts** - Entire file: ~36 lines
10. **components/ui/form.tsx** - Entire file: ~115 lines
11. **lib/hooks/examples/** - Entire directory: ~300 lines

### Needs Review (Medium Confidence)

1. **lib/trpc/routers/_app.ts** - Commented notification router (keep if planned feature)
2. **lib/types/database.ts** - School types (keep if school feature planned)
3. **react-cookie-consent** - Verify if custom implementation is sufficient
4. **app/checkin-preview/** - Decide if design preview should be kept
5. **useMutationWithToast, useRoleOwnership, useAuthGuard** - May be intended for future use

---

## 7. Recommendations

### Immediate Actions (Low Risk)

1. Remove the orphaned `hooks/` directory files (except `use-realtime-task-completions.ts`)
2. Remove `lib/hooks/use-retry-mutation.ts`
3. Remove `components/ui/form.tsx`
4. Remove unused formatting functions from `lib/utils/format.ts`

### Consider Removing (Medium Risk)

1. `lib/services/condition-optimizer.service.ts` - Complex optimization service never integrated
2. `lib/services/goal-recommendation.service.ts` - Recommendation engine never integrated
3. `lib/hooks/examples/` directory - Example code not needed in production

### Keep for Now

1. `lib/utils/realtime-diagnostics.ts` - Useful for debugging realtime issues
2. Notification-related commented code - May be upcoming feature
3. School-related types - May be upcoming feature

---

## 8. Impact Assessment

| Action | Files Affected | Risk Level | Estimated Time |
|--------|---------------|------------|----------------|
| Remove orphaned hooks | 4 files | LOW | 5 min |
| Remove unused services | 2 files | LOW | 5 min |
| Clean format.ts | 1 file | LOW | 10 min |
| Remove form.tsx | 1 file | LOW | 2 min |
| Review dependencies | 1 file | MEDIUM | 15 min |

**Total Estimated Cleanup Time:** 37 minutes

---

*Report generated for audit purposes only. No changes have been made to the codebase.*
