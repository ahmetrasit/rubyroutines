// Test script to verify tRPC v11 cache key format
// Run this in the browser console to check cache keys

function checkCacheKeys() {
  // Get the query client from React Query
  const queryClient = window.__REACT_QUERY_DEVTOOLS__?.queryClient ||
                      window.queryClient ||
                      (() => {
                        // Try to find it in React fiber
                        const container = document.querySelector('#__next') || document.querySelector('#root');
                        if (!container || !container._reactRootContainer) return null;

                        let fiber = container._reactRootContainer._internalRoot?.current;
                        while (fiber) {
                          if (fiber.memoizedProps?.value?.queryClient) {
                            return fiber.memoizedProps.value.queryClient;
                          }
                          fiber = fiber.child || fiber.sibling || fiber.return;
                        }
                        return null;
                      })();

  if (!queryClient) {
    console.error('Could not find query client. Make sure React Query DevTools is installed.');
    return;
  }

  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  console.log('=== TRPC Cache Keys Analysis ===');
  console.log(`Total queries in cache: ${queries.length}`);

  // Group queries by entity type
  const taskQueries = [];
  const personQueries = [];
  const routineQueries = [];
  const otherQueries = [];

  queries.forEach(query => {
    const key = query.queryKey;
    const keyStr = JSON.stringify(key);

    if (keyStr.includes('task')) {
      taskQueries.push(key);
    } else if (keyStr.includes('person')) {
      personQueries.push(key);
    } else if (keyStr.includes('routine')) {
      routineQueries.push(key);
    } else {
      otherQueries.push(key);
    }
  });

  console.log('\n📋 Task Queries:', taskQueries.length);
  taskQueries.forEach((key, i) => {
    console.log(`  ${i + 1}.`, JSON.stringify(key));
  });

  console.log('\n👤 Person Queries:', personQueries.length);
  personQueries.forEach((key, i) => {
    console.log(`  ${i + 1}.`, JSON.stringify(key));
  });

  console.log('\n🔄 Routine Queries:', routineQueries.length);
  routineQueries.forEach((key, i) => {
    console.log(`  ${i + 1}.`, JSON.stringify(key));
  });

  console.log('\n❓ Other Queries:', otherQueries.length);
  otherQueries.forEach((key, i) => {
    console.log(`  ${i + 1}.`, JSON.stringify(key));
  });

  // Check for format issues
  console.log('\n=== Format Analysis ===');

  const v10Format = [];
  const v11Format = [];
  const unknown = [];

  queries.forEach(query => {
    const key = query.queryKey;

    // tRPC v11 format: [['namespace', 'procedure'], { input, type }]
    if (Array.isArray(key) && key.length === 2 &&
        Array.isArray(key[0]) && key[0].length === 2 &&
        typeof key[1] === 'object' && key[1].type === 'query') {
      v11Format.push(key);
    }
    // Old v10 format: ['namespace', 'procedure', params]
    else if (Array.isArray(key) && key.length >= 2 &&
             typeof key[0] === 'string' && typeof key[1] === 'string') {
      v10Format.push(key);
    } else {
      unknown.push(key);
    }
  });

  console.log(`✅ tRPC v11 format: ${v11Format.length} queries`);
  console.log(`❌ Old v10 format: ${v10Format.length} queries`);
  if (v10Format.length > 0) {
    console.log('  Old format queries:');
    v10Format.forEach((key, i) => {
      console.log(`    ${i + 1}.`, JSON.stringify(key));
    });
  }

  console.log(`❓ Unknown format: ${unknown.length} queries`);
  if (unknown.length > 0) {
    console.log('  Unknown format queries:');
    unknown.forEach((key, i) => {
      console.log(`    ${i + 1}.`, JSON.stringify(key));
    });
  }

  return {
    total: queries.length,
    v11Format: v11Format.length,
    v10Format: v10Format.length,
    unknown: unknown.length,
    taskQueries,
    personQueries,
    routineQueries
  };
}

// Run the check
checkCacheKeys();