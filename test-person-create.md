# Test Person Creation - Optimistic Update Debug

## Test Steps

1. Open browser console (F12)
2. Navigate to http://localhost:3000/parent
3. Look at console for "CACHE INSPECTOR" output - note the query key format
4. Click "Add Member" button
5. Fill in name and select emoji/color
6. Click "Create" button
7. Watch console for debug output

## Expected Console Output

### Step 1: Cache Inspector
Should show the actual query key format being used by tRPC

### Step 2: Create Button Click
- 🚀 CREATE PERSON TRIGGERED
- Shows roleId, name, avatar

### Step 3: onMutate Hook
- 🔍 useOptimisticCreate.onMutate called
- Shows listKeys array
- Shows processing of each key
- Shows if personSharing query is detected
- Shows old and new data

## What to Check

1. **Query Key Format**: Is it using tRPC v11 format `[['personSharing', 'getAccessiblePersons'], { input: { roleId }, type: 'query' }]`?

2. **Data Structure**: Does the personSharing query have this structure?
   ```js
   {
     ownedPersons: [...],
     sharedPersons: [...],
     allPersons: [...]
   }
   ```

3. **Cache Update**: After clicking Create, does the console show the cache being updated with the new person?

4. **UI Update**: Does the new person card appear immediately without refresh?

## If It Still Doesn't Work

Check for:
- JavaScript errors in console
- Network tab - is the mutation successful?
- React Query DevTools if installed
- Any console warnings about query keys

## Debug Commands

In browser console, run:
```javascript
// Get query client
const queryClient = window.__REACT_QUERY_CLIENT__ ||
  document.querySelector('#__next').__reactInternalInstance?.return?.stateNode?.queryClient;

// Get all cached queries
const cache = queryClient?.getQueryCache();
const queries = cache?.getAll();

// Find person-related queries
queries?.forEach(q => {
  if (JSON.stringify(q.queryKey).includes('person')) {
    console.log('Query:', q.queryKey);
    console.log('Data:', q.state.data);
  }
});
```