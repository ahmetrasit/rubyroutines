# Test Instructions for Optimistic Updates Fix

## What Was Fixed

### Root Cause 1: Wrong Enum Value
**Problem**: The `useOptimisticCheckin` hook was using `TaskType.MULTI` which doesn't exist. The correct enum value is `TaskType.MULTIPLE_CHECKIN`.

**Fix Applied**: Changed all occurrences of `TaskType.MULTI` to `TaskType.MULTIPLE_CHECKIN` in `/lib/hooks/useOptimisticCheckin.ts`

### Root Cause 2: Different Data Structure for Kiosk
**Problem**: The kiosk mode uses a different data structure (`{ person, tasks }`) compared to the dashboard (`person.assignments.routine.tasks`), but was using the same optimistic update hook.

**Fix Applied**: Created a new specialized hook `/lib/hooks/useOptimisticKioskCheckin.ts` that handles the kiosk data structure correctly.

### Root Cause 3: Value Type Mismatch
**Problem**: The `value` parameter was being passed as a string but treated as a number in some places.

**Fix Applied**: Updated the hooks to properly convert string values to numbers using `parseInt(value, 10)` when needed for PROGRESS tasks.

## Files Modified

1. **`/lib/hooks/useOptimisticCheckin.ts`**
   - Fixed enum value from `TaskType.MULTI` to `TaskType.MULTIPLE_CHECKIN`
   - Fixed value parameter type handling

2. **`/lib/hooks/useOptimisticKioskCheckin.ts`** (NEW FILE)
   - Created specialized hook for kiosk mode
   - Handles `{ person, tasks }` data structure
   - Properly manages kiosk-specific cache keys

3. **`/app/kiosk/[code]/tasks/page.tsx`**
   - Updated imports to use new `useOptimisticKioskCheckin` hook
   - Fixed hook initialization with correct parameters

## How to Test

### Dashboard Check-in Modal Test

1. **Navigate to Dashboard**
   - Go to http://localhost:3000
   - Log in as a parent or teacher

2. **Open Check-in Modal**
   - Click on a person's name to open their check-in modal

3. **Test Simple Tasks**
   - Click on any uncompleted simple task
   - ✅ **Expected**: Task should immediately show as completed (visual change)
   - ✅ **Expected**: Checkmark should appear instantly
   - ✅ **Expected**: Background color should change immediately

4. **Test Multiple Check-in Tasks**
   - Click the "+1" button on any multi check-in task
   - ✅ **Expected**: Counter should increment immediately
   - ✅ **Expected**: Brief animation should play
   - ✅ **Expected**: No delay or loading state

5. **Test Progress Tasks**
   - Enter a value and click "Add" on any progress task
   - ✅ **Expected**: Total value should update immediately
   - ✅ **Expected**: Progress bar (if shown) should update instantly

### Kiosk Mode Test

1. **Access Kiosk Mode**
   - Go to http://localhost:3000/kiosk
   - Enter kiosk code
   - Select a person

2. **Test Task Completion**
   - Complete various task types
   - ✅ **Expected**: All visual updates should be immediate
   - ✅ **Expected**: No refresh needed to see changes

### Error Handling Test

1. **Disconnect Network** (to simulate server error)
   - Open Network tab in DevTools
   - Set to "Offline"
   - Try to complete a task
   - ✅ **Expected**: Optimistic update should roll back
   - ✅ **Expected**: Error toast should appear
   - ✅ **Expected**: Task should return to previous state

## Verification Checklist

- [ ] Simple tasks show immediate visual feedback in dashboard
- [ ] Multiple check-in tasks increment counter immediately
- [ ] Progress tasks update total value instantly
- [ ] Kiosk mode shows immediate updates for all task types
- [ ] No page refresh required to see changes
- [ ] Optimistic updates roll back on error
- [ ] Undo functionality works within time limit
- [ ] All task types properly update completion state

## Technical Details

The optimistic update works by:
1. Immediately updating the React Query cache with the expected result
2. Showing the UI change instantly
3. Sending the actual mutation to the server in the background
4. If successful, replacing temporary data with server response
5. If failed, rolling back to previous state

This provides the best user experience with instant feedback while maintaining data consistency.