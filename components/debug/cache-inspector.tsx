'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function CacheInspector({ roleId, routineId }: { roleId?: string; routineId?: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();

    console.log('=== CACHE INSPECTOR ===');
    console.log('Total queries in cache:', allQueries.length);

    allQueries.forEach(query => {
      const key = query.queryKey;
      const data = query.state.data;
      const keyStr = JSON.stringify(key);

      // Look for person-related queries
      if (keyStr.includes('person')) {
        console.log('Found person query:');
        console.log('  Key:', JSON.stringify(key, null, 2));
        console.log('  Data structure:', data);
        console.log('  Data type:', Array.isArray(data) ? 'array' : typeof data);
        if (data && typeof data === 'object' && 'ownedPersons' in data) {
          console.log('  Has ownedPersons:', (data as any).ownedPersons?.length);
          console.log('  Has sharedPersons:', (data as any).sharedPersons?.length);
        }
      }

      // Look for task-related queries
      if (keyStr.includes('task')) {
        console.log('Found task query:');
        console.log('  Key:', JSON.stringify(key, null, 2));
        console.log('  Data:', data);
        if (Array.isArray(data)) {
          console.log('  Task count:', data.length);
        }
      }
    });

    // Specifically check for queries based on what's provided
    const testKeys: any[] = [];

    if (roleId) {
      // Person-related queries
      testKeys.push(
        // Old format
        ['personSharing', 'getAccessiblePersons', { roleId }],
        // tRPC v11 format
        [['personSharing', 'getAccessiblePersons'], { input: { roleId }, type: 'query' }],
        // Variations
        [['personSharing', 'getAccessiblePersons'], { roleId }],
        ['personSharing.getAccessiblePersons', { input: { roleId }, type: 'query' }],
        [['personSharing.getAccessiblePersons'], { input: { roleId }, type: 'query' }]
      );
    }

    if (routineId) {
      // Task-related queries
      testKeys.push(
        // Old format
        ['task', 'list', { routineId }],
        // tRPC v11 format
        [['task', 'list'], { input: { routineId }, type: 'query' }],
        // Variations
        [['task', 'list'], { routineId }],
        ['task.list', { input: { routineId }, type: 'query' }],
        [['task.list'], { input: { routineId }, type: 'query' }]
      );
    }

    if (testKeys.length > 0) {
      console.log('=== Testing specific key formats ===');
      testKeys.forEach((key, index) => {
        const data = queryClient.getQueryData(key);
        console.log(`Test ${index + 1}:`, JSON.stringify(key));
        console.log(`  Result:`, data ? 'Found data' : 'No data');
        if (data) {
          console.log(`  Data:`, data);
        }
      });
    }

    console.log('=== END CACHE INSPECTOR ===');
  }, [queryClient, roleId, routineId]);

  return null;
}