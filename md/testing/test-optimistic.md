# Test Optimistic Updates Fix

## Summary of Changes

### Root Cause
The optimistic updates weren't working because of **cache key mismatches**. The components were querying data with one set of parameters, but the optimistic hooks were updating cache with different parameters.

### Examples of Mismatches Found:

1. **Person List**:
   - Query: `{ roleId }`
   - Optimistic update was using: `{ roleId, includeInactive: false }`
   - These don't match, so UI wouldn't see the updates!

2. **Routine List**:
   - Query: `{ roleId }` or `{ roleId, personId }`
   - Optimistic update was using only one variant
   - Missing coverage for all query variations!

### Solution Implemented

1. **Enhanced the optimistic hooks** to support multiple cache keys:
   - `useOptimisticCreate` now accepts an array of cache keys
   - `useOptimisticUpdate` now accepts an array of cache keys
   - This allows updating ALL possible cache entries

2. **Fixed cache key configurations** in components:
   - Person form now updates both `{ roleId }` and `{ roleId, includeInactive: true }`
   - Routine form now updates all relevant cache key combinations

### Files Modified:

1. `/lib/hooks/useOptimisticCreate.ts` - Enhanced to support multiple cache keys
2. `/lib/hooks/useOptimisticUpdate.ts` - Enhanced to support multiple cache keys
3. `/components/person/person-form.tsx` - Fixed cache keys for person list
4. `/components/routine/routine-form.tsx` - Fixed cache keys for routine list

## Testing Instructions

### Test Person Creation:
1. Go to the persons/students page
2. Click "Add Person"
3. Enter a name and select an avatar
4. Click Save
5. **EXPECTED**: Person appears in list IMMEDIATELY without refresh
6. **BEFORE FIX**: Person only appeared after page refresh

### Test Person Editing:
1. Click edit on any person
2. Change their name or avatar
3. Click Save
4. **EXPECTED**: Changes appear IMMEDIATELY without refresh
5. **BEFORE FIX**: Changes only appeared after page refresh

### Test Routine Creation:
1. Go to routines page
2. Click "Add Routine"
3. Enter routine details
4. Click Save
5. **EXPECTED**: Routine appears in list IMMEDIATELY without refresh
6. **BEFORE FIX**: Routine only appeared after page refresh

### Test Task Creation:
1. Open any routine
2. Click "Add Task"
3. Enter task details
4. Click Save
5. **EXPECTED**: Task appears in list IMMEDIATELY without refresh

## How the Fix Works

The optimistic hooks now:
1. Accept multiple cache keys to update
2. Update ALL matching cache entries when a mutation occurs
3. Properly rollback ALL cache entries if an error occurs

Example:
```typescript
// Before - only updated one cache key
listKey: ['person', 'list', { roleId }]

// After - updates multiple cache keys
listKey: [
  ['person', 'list', { roleId }],
  ['person', 'list', { roleId, includeInactive: true }]
]
```

This ensures that no matter how a component queries the data, it will see the optimistic updates immediately!