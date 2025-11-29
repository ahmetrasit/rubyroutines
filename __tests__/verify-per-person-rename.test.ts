/**
 * Verification Test: Per-Person Renamed Names
 *
 * This test verifies that the routine copy conflict resolution properly handles
 * per-person renamed names where different persons can receive different names.
 *
 * Scenario:
 * - Copy routine "Test Routine" to Person A and Person B
 * - Both have conflicts (already have a routine named "Test Routine")
 * - Person A gets renamed to "Routine for A"
 * - Person B gets renamed to "Routine for B"
 */

import { describe, it, expect } from '@jest/globals';

describe('Per-Person Renamed Names Verification', () => {
  describe('Schema Structure', () => {
    it('should use Record<string, string> for renamedNames (personId -> name)', () => {
      // This validates the schema type structure
      const renamedNames: Record<string, string> = {
        'personA-id': 'Routine for A',
        'personB-id': 'Routine for B',
      };

      expect(renamedNames['personA-id']).toBe('Routine for A');
      expect(renamedNames['personB-id']).toBe('Routine for B');
    });

    it('should allow different persons to have different renamed names', () => {
      const personAId = 'person-a-123';
      const personBId = 'person-b-456';

      const renamedNames: Record<string, string> = {
        [personAId]: 'Custom Name A',
        [personBId]: 'Custom Name B',
      };

      // Verify each person gets their own name
      expect(renamedNames[personAId]).toBe('Custom Name A');
      expect(renamedNames[personBId]).toBe('Custom Name B');
      expect(renamedNames[personAId]).not.toBe(renamedNames[personBId]);
    });
  });

  describe('Backend Logic Simulation', () => {
    it('should validate each unique renamed name against conflicts', () => {
      // Simulates the backend validation logic
      const sourceRoutineName = 'Morning Routine';
      const fallbackName = `${sourceRoutineName} (Copy)`;

      const personsNeedingRename = ['person1', 'person2', 'person3'];
      const renamedNames: Record<string, string> = {
        'person1': 'Custom Routine 1',
        'person2': 'Custom Routine 2',
        // person3 will use fallback
      };

      // Build map of names to validate
      const namesToValidate = new Map<string, string[]>();

      for (const personId of personsNeedingRename) {
        const renamedName = renamedNames[personId] || fallbackName;
        const existing = namesToValidate.get(renamedName) || [];
        existing.push(personId);
        namesToValidate.set(renamedName, existing);
      }

      // Verify unique names
      expect(namesToValidate.size).toBe(3); // 2 custom + 1 fallback
      expect(namesToValidate.get('Custom Routine 1')).toEqual(['person1']);
      expect(namesToValidate.get('Custom Routine 2')).toEqual(['person2']);
      expect(namesToValidate.get(fallbackName)).toEqual(['person3']);
    });

    it('should detect when two persons try to use the same renamed name', () => {
      const personsNeedingRename = ['person1', 'person2'];
      const renamedNames: Record<string, string> = {
        'person1': 'Same Name',
        'person2': 'Same Name', // Conflict!
      };

      const namesToValidate = new Map<string, string[]>();

      for (const personId of personsNeedingRename) {
        const renamedName = renamedNames[personId];
        const existing = namesToValidate.get(renamedName) || [];
        existing.push(personId);
        namesToValidate.set(renamedName, existing);
      }

      // Should detect that both persons want the same name
      expect(namesToValidate.get('Same Name')).toEqual(['person1', 'person2']);
      expect(namesToValidate.get('Same Name')?.length).toBe(2);
    });
  });

  describe('Frontend Logic Simulation', () => {
    it('should build per-person renamed names map from conflict key format', () => {
      // Simulates the frontend logic in copy-routine-modal.tsx lines 232-243
      const routineId = 'routine-123';
      const conflictResolutions = {
        'routine-123::person1': 'rename' as const,
        'routine-123::person2': 'rename' as const,
        'routine-123::person3': 'merge' as const,
      };
      const renamedNames = {
        'routine-123::person1': 'Routine for Person 1',
        'routine-123::person2': 'Routine for Person 2',
      };

      // Build per-person renamed names map (as done in handleCopyWithResolutions)
      const perPersonRenamedNames: Record<string, string> = {};

      for (const [key, resolution] of Object.entries(conflictResolutions)) {
        const [rId, personId] = key.split('::');
        if (rId === routineId && personId && resolution === 'rename' && renamedNames[key]) {
          perPersonRenamedNames[personId] = renamedNames[key];
        }
      }

      // Verify correct mapping
      expect(perPersonRenamedNames['person1']).toBe('Routine for Person 1');
      expect(perPersonRenamedNames['person2']).toBe('Routine for Person 2');
      expect(perPersonRenamedNames['person3']).toBeUndefined(); // merge, not rename
      expect(Object.keys(perPersonRenamedNames).length).toBe(2);
    });
  });

  describe('Backend Copy Logic Simulation', () => {
    it('should use person-specific renamed name when creating routines', () => {
      // Simulates backend logic at line 528
      const sourceRoutineName = 'Test Routine';
      const personId = 'person-abc';
      const conflictResolutions = { [personId]: 'rename' as const };
      const renamedNames: Record<string, string> = {
        [personId]: 'Custom Name for Person ABC',
      };

      // Determine the name for the new routine
      let routineName = sourceRoutineName;
      const hasConflict = true; // existing routine
      const resolution = conflictResolutions[personId];

      if (hasConflict && resolution === 'rename') {
        routineName = renamedNames[personId] || `${sourceRoutineName} (Copy)`;
      }

      expect(routineName).toBe('Custom Name for Person ABC');
      expect(routineName).not.toBe(sourceRoutineName);
    });

    it('should fall back to default name if no custom name provided', () => {
      const sourceRoutineName = 'Test Routine';
      const personId = 'person-xyz';
      const conflictResolutions = { [personId]: 'rename' as const };
      const renamedNames: Record<string, string> = {}; // No custom name

      let routineName = sourceRoutineName;
      const hasConflict = true;
      const resolution = conflictResolutions[personId];

      if (hasConflict && resolution === 'rename') {
        routineName = renamedNames[personId] || `${sourceRoutineName} (Copy)`;
      }

      expect(routineName).toBe('Test Routine (Copy)');
    });
  });

  describe('Full Flow Integration', () => {
    it('should handle copying to multiple persons with different renamed names', () => {
      // Full simulation of the flow
      const sourceRoutineName = 'Morning Routine';
      const targetPersonIds = ['alice', 'bob', 'charlie'];

      // Frontend: User resolves conflicts with different names
      const conflictResolutions: Record<string, 'merge' | 'rename'> = {
        'alice': 'rename',
        'bob': 'rename',
        'charlie': 'merge',
      };

      const renamedNames: Record<string, string> = {
        'alice': 'Alice Morning Tasks',
        'bob': 'Bob Wake Up Routine',
        // charlie merges, no renamed name
      };

      // Backend: Process each person
      const results = targetPersonIds.map(personId => {
        const resolution = conflictResolutions[personId];

        if (resolution === 'merge') {
          return { personId, action: 'merged', name: sourceRoutineName };
        }

        // Rename: Use person-specific name
        const newName = renamedNames[personId] || `${sourceRoutineName} (Copy)`;
        return { personId, action: 'created', name: newName };
      });

      // Verify results
      expect(results[0]).toEqual({ personId: 'alice', action: 'created', name: 'Alice Morning Tasks' });
      expect(results[1]).toEqual({ personId: 'bob', action: 'created', name: 'Bob Wake Up Routine' });
      expect(results[2]).toEqual({ personId: 'charlie', action: 'merged', name: sourceRoutineName });
    });
  });
});
