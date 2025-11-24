'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function CacheInspector({ roleId }: { roleId: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();

    console.log('=== CACHE INSPECTOR ===');
    console.log('Total queries in cache:', allQueries.length);

    allQueries.forEach(query => {
      const key = query.queryKey;
      const data = query.state.data;

      // Look for person-related queries
      if (JSON.stringify(key).includes('person')) {
        console.log('Found person query:');
        console.log('  Key:', JSON.stringify(key, null, 2));
        console.log('  Data structure:', data);
        console.log('  Data type:', Array.isArray(data) ? 'array' : typeof data);
        if (data && typeof data === 'object' && 'ownedPersons' in data) {
          console.log('  Has ownedPersons:', (data as any).ownedPersons?.length);
          console.log('  Has sharedPersons:', (data as any).sharedPersons?.length);
        }
      }
    });

    // Specifically check for the getAccessiblePersons query
    const testKeys = [
      // Old format
      ['personSharing', 'getAccessiblePersons', { roleId }],
      // tRPC v11 format
      [['personSharing', 'getAccessiblePersons'], { input: { roleId }, type: 'query' }],
      // Variations
      [['personSharing', 'getAccessiblePersons'], { roleId }],
      ['personSharing.getAccessiblePersons', { input: { roleId }, type: 'query' }],
      [['personSharing.getAccessiblePersons'], { input: { roleId }, type: 'query' }],
    ];

    console.log('=== Testing specific key formats ===');
    testKeys.forEach((key, index) => {
      const data = queryClient.getQueryData(key);
      console.log(`Test ${index + 1}:`, JSON.stringify(key));
      console.log(`  Result:`, data ? 'Found data' : 'No data');
      if (data) {
        console.log(`  Data:`, data);
      }
    });

    console.log('=== END CACHE INSPECTOR ===');
  }, [queryClient, roleId]);

  return null;
}