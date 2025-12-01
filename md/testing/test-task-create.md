# Test Task Creation - Debug Guide

## Problem
Task creation doesn't appear immediately - only shows after page refresh.

## Test Steps

1. **Open browser console** (F12)
2. **Navigate to a routine** (e.g., http://localhost:3000/parent/routines/[routine-id])
3. **Look for "CACHE INSPECTOR" output** in console
   - Note the task query key format
   - Note if any task queries are found
4. **Click "Add Task" button**
5. **Fill in task details**
6. **Click "Create Task"**
7. **Watch console for debug output**

## Expected Console Output

### Step 1: Cache Inspector on Page Load
```
=== CACHE INSPECTOR ===
Found task query:
  Key: [["task","list"],{"input":{"routineId":"xxx"},"type":"query"}]
  Data: [array of existing tasks]
  Task count: X
```

### Step 2: Click Create Task
```
🚀 CREATE TASK TRIGGERED
  routineId: xxx
  name: Task Name
  type: SIMPLE/MULTIPLE_CHECKIN/PROGRESS
```

### Step 3: Optimistic Update
```
🔍 useOptimisticCreate.onMutate called
  listKeys: [[["task","list"],{"input":{"routineId":"xxx"},"type":"query"}]]
  Processing key: [["task","list"],{"input":{"routineId":"xxx"},"type":"query"}]
  Current data for key: [existing tasks]
  Old array data: [existing tasks]
  New array data: [...existing, newTask]
```

## What to Check

1. **Query Key Format**
   - Is the query using tRPC v11 format?
   - Format should be: `[['task', 'list'], { input: { routineId }, type: 'query' }]`

2. **Cache Key Match**
   - Does the listKey in task-form.tsx match the actual query key?
   - They must match EXACTLY for updates to work

3. **Data Update**
   - After clicking Create, does the cache get updated?
   - Does the new task appear in the "New array data" log?

4. **UI Update**
   - Does the new task card appear immediately?
   - Or does it only appear after refresh?

## Debug Commands

Run these in browser console:

```javascript
// 1. Find the query client
const queryClient = window.__REACT_QUERY_DEVTOOLS__?.queryClient ||
                    (() => {
                      const container = document.querySelector('#__next');
                      if (!container?._reactRootContainer) return null;
                      let fiber = container._reactRootContainer._internalRoot?.current;
                      while (fiber) {
                        if (fiber.memoizedProps?.value?.queryClient) {
                          return fiber.memoizedProps.value.queryClient;
                        }
                        fiber = fiber.child || fiber.sibling || fiber.return;
                      }
                      return null;
                    })();

// 2. Get all task queries
const cache = queryClient?.getQueryCache();
const queries = cache?.getAll() || [];
const taskQueries = queries.filter(q =>
  JSON.stringify(q.queryKey).includes('task')
);
console.log('Task queries:', taskQueries.map(q => q.queryKey));

// 3. Test specific key formats (replace 'your-routine-id' with actual ID)
const routineId = 'your-routine-id';
const testKeys = [
  // Old v10 format
  ['task', 'list', { routineId }],
  // New v11 format
  [['task', 'list'], { input: { routineId }, type: 'query' }],
  // Variations
  [['task', 'list'], { routineId }],
  ['task.list', { input: { routineId }, type: 'query' }],
];

testKeys.forEach((key, i) => {
  const data = queryClient?.getQueryData(key);
  console.log(`Format ${i + 1}:`, JSON.stringify(key));
  console.log('  Has data:', !!data);
  if (data) console.log('  Task count:', Array.isArray(data) ? data.length : 'not array');
});

// 4. Manually trigger cache update (for testing)
const testKey = [['task', 'list'], { input: { routineId }, type: 'query' }];
const currentData = queryClient?.getQueryData(testKey);
if (currentData && Array.isArray(currentData)) {
  const newTask = {
    id: 'temp-' + Date.now(),
    name: 'Test Task',
    emoji: '🔥',
    color: '#FF0000',
    type: 'SIMPLE',
    // ... other fields
  };
  queryClient.setQueryData(testKey, [...currentData, newTask]);
  console.log('Manually added test task - check if UI updates');
}
```

## Potential Issues

### Issue 1: Cache Key Mismatch
- **Symptom**: Console shows cache update but UI doesn't change
- **Cause**: Component queries with different key than mutation updates
- **Fix**: Ensure exact match between query and mutation keys

### Issue 2: Wrong Key Format
- **Symptom**: No cache update logs in console
- **Cause**: Using old v10 format instead of v11
- **Fix**: Update to `[['task', 'list'], { input: { routineId }, type: 'query' }]`

### Issue 3: Missing routineId
- **Symptom**: routineId is undefined in logs
- **Cause**: Component not passing routineId correctly
- **Fix**: Check props chain from parent to TaskForm

### Issue 4: Query Not Cached
- **Symptom**: No task queries found in cache
- **Cause**: Query hasn't run or has different key
- **Fix**: Check TaskList component's useQuery call

## Files to Check

1. **components/task/task-form.tsx** (lines 59-60)
   - Check listKey format
   - Check routineId is passed correctly

2. **components/task/task-list.tsx** (line 22-29)
   - Check useQuery key format
   - Check if query is enabled

3. **lib/hooks/useOptimisticCreate.ts** (lines 83-157)
   - Add more debug logs if needed
   - Check cache update logic

## Next Steps

After running these tests:

1. **If cache keys don't match**: Update task-form.tsx listKey
2. **If no queries in cache**: Check task-list.tsx query
3. **If updates work but UI doesn't change**: Check React re-render
4. **If completely broken**: Add more debug logs to trace flow

Report findings with:
- Exact query key format from cache
- Console output during creation
- Whether manual cache update works
- Any error messages