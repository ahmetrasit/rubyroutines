# tRPC v11 Cache Key Format Guide

## The Problem
tRPC v11 changed its cache key format from v10. Using the old format causes optimistic updates to fail silently - new items won't appear until page refresh.

## The Solution
Always use this format for tRPC v11:
```typescript
[['namespace', 'procedure'], { input: { params }, type: 'query' }]
```

## Common Patterns

### For Create Operations
```typescript
const createMutation = useOptimisticCreate(createMutationBase, {
  entityName: 'Entity',
  listKey: [['entity', 'list'], { input: { parentId }, type: 'query' }],
  createItem: (input, tempId) => ({ ... }),
  invalidateKeys: [
    [['related', 'getById'], { type: 'query' }],
  ],
});
```

### For Update Operations
```typescript
const updateMutation = useOptimisticUpdate(updateMutationBase, {
  entityName: 'Entity',
  listKey: [['entity', 'list'], { input: { parentId }, type: 'query' }],
  itemKey: [['entity', 'getById'], { input: { id }, type: 'query' }],
  updateItem: (item, input) => ({ ... }),
  invalidateKeys: [
    [['related', 'list'], { type: 'query' }],
  ],
});
```

### For Delete Operations
```typescript
const deleteMutation = useOptimisticDelete(deleteMutationBase, {
  entityName: 'Entity',
  listKey: [['entity', 'list'], { input: { parentId }, type: 'query' }],
  invalidateKeys: [
    [['related', 'list'], { type: 'query' }],
  ],
});
```

## How to Debug Cache Keys

### 1. Use the CacheInspector Component
Add to your component to see actual cache keys in console:
```tsx
import { CacheInspector } from '@/components/debug/cache-inspector';

// In your component
<CacheInspector roleId={roleId} routineId={routineId} />
```

### 2. Browser Console Commands
```javascript
// Get query client (try multiple methods)
const queryClient = window.__REACT_QUERY_DEVTOOLS__?.queryClient ||
                    window.queryClient ||
                    document.querySelector('#__next')?._reactRootContainer?._internalRoot?.current?.memoizedProps?.value?.queryClient;

// Get all cached queries
const cache = queryClient?.getQueryCache();
const queries = cache?.getAll();

// Find specific queries
queries?.forEach(q => {
  const keyStr = JSON.stringify(q.queryKey);
  if (keyStr.includes('task')) {
    console.log('Query:', q.queryKey);
    console.log('Data:', q.state.data);
  }
});

// Test if a specific key exists
const testKey = [['task', 'list'], { input: { routineId: 'your-id' }, type: 'query' }];
const data = queryClient?.getQueryData(testKey);
console.log('Data for key:', data);
```

### 3. Check Console Logs
When debug mode is enabled, you'll see:
```
🚀 CREATE TASK TRIGGERED
  routineId: abc-123
  name: Task Name

🔍 useOptimisticCreate.onMutate called
  listKeys: [[['task', 'list'], { input: { routineId: 'abc-123' }, type: 'query' }]]
  Processing key: [['task', 'list'], { input: { routineId: 'abc-123' }, type: 'query' }]
  Old array data: [...]
  New array data: [..., newTask]
```

## Examples by Entity

### Person Creation
```typescript
listKey: [
  [['person', 'list'], { input: { roleId }, type: 'query' }],
  [['personSharing', 'getAccessiblePersons'], { input: { roleId }, type: 'query' }],
]
```

### Task Creation
```typescript
listKey: [['task', 'list'], { input: { routineId }, type: 'query' }]
```

### Routine Creation
```typescript
listKey: [['routine', 'list'], { input: { roleId }, type: 'query' }]
```

### Goal Creation (TODO - Not yet optimistic)
```typescript
// Currently uses regular mutation, needs conversion to optimistic
listKey: [['goal', 'list'], { input: { roleId }, type: 'query' }]
```

## Common Mistakes

### ❌ Wrong: Old v10 Format
```typescript
['task', 'list', { routineId }]
```

### ❌ Wrong: Missing type field
```typescript
[['task', 'list'], { input: { routineId } }]  // Missing 'type: query'
```

### ❌ Wrong: Incorrect nesting
```typescript
['task', 'list', { input: { routineId }, type: 'query' }]  // Not nested array
```

### ✅ Correct: tRPC v11 Format
```typescript
[['task', 'list'], { input: { routineId }, type: 'query' }]
```

## Verification Checklist

When implementing optimistic updates:

1. **Check the actual query key** - Use CacheInspector or browser console
2. **Match the exact format** - Even minor differences break updates
3. **Test immediate appearance** - Item should show without refresh
4. **Check console for errors** - Look for cache update logs
5. **Verify invalidations** - Related queries should refresh after success

## Current Status (Nov 2024)

### ✅ Fixed and Working
- Person creation/update (person-form.tsx)
- Task creation/update (task-form.tsx)
- Routine creation/update (routine-form.tsx)
- Task completions (person-checkin-modal.tsx)
- Kiosk check-ins (useOptimisticKioskCheckin.ts)

### ⚠️ Needs Investigation
- Task creation may still have issues (reported by user)
- Need to verify exact cache key match

### ❌ Not Yet Optimistic
- Goal creation/update (goal-form.tsx) - uses regular mutations
- Group/classroom operations
- Condition operations

## Troubleshooting Steps

If optimistic updates aren't working:

1. **Add CacheInspector** to the component
2. **Check console** for the actual cache key format
3. **Compare** with the listKey in your mutation
4. **Verify** they match EXACTLY (use JSON.stringify to compare)
5. **Add debug logs** to useOptimisticCreate.ts temporarily
6. **Test** create operation and watch console
7. **Remove debug code** after fixing

## Migration Guide

To convert a regular mutation to optimistic:

1. Import the optimistic hook:
```typescript
import { useOptimisticCreate } from '@/lib/hooks';
```

2. Replace the mutation setup:
```typescript
// Before
const createMutation = trpc.entity.create.useMutation({
  onSuccess: () => { ... }
});

// After
const createMutationBase = trpc.entity.create.useMutation();
const createMutation = useOptimisticCreate(createMutationBase, {
  entityName: 'Entity',
  listKey: [['entity', 'list'], { input: { parentId }, type: 'query' }],
  createItem: (input, tempId) => ({ ... }),
  closeDialog: onClose,
});
```

3. Update the form submit to use the new mutation:
```typescript
createMutation.mutate({ ... });
```

## References
- tRPC v11 migration guide
- React Query cache documentation
- Project commits: 81cd21d, 3f693be, 9e2ad62