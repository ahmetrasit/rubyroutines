/**
 * Integration Test: Per-Person Renamed Names Full Flow
 *
 * This test simulates the complete flow of copying a routine with
 * per-person renamed names, including the validation logic.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { EntityStatus } from '@/lib/types/prisma-enums';

describe('Per-Person Renamed Names - Integration', () => {
  let testUser: any;
  let testRole: any;
  let sourceRoutine: any;
  let personAlice: any;
  let personBob: any;
  let personCharlie: any;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `per-person-rename-${Date.now()}@test.com`,
        name: 'Per Person Rename Test User',
        role: 'USER',
      },
    });

    // Create role
    testRole = await prisma.role.create({
      data: {
        userId: testUser.id,
        type: 'PARENT',
      },
    });

    // Create source routine
    sourceRoutine = await prisma.routine.create({
      data: {
        roleId: testRole.id,
        name: 'Test Routine',
        description: 'Test routine for per-person rename',
        type: 'REGULAR',
        resetPeriod: 'DAILY',
        status: EntityStatus.ACTIVE,
        tasks: {
          create: [
            { name: 'Task 1', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
            { name: 'Task 2', type: 'SIMPLE', order: 1, status: EntityStatus.ACTIVE },
          ],
        },
      },
    });

    // Create persons with existing conflicting routines
    personAlice = await prisma.person.create({
      data: {
        roleId: testRole.id,
        name: 'Alice',
        avatar: JSON.stringify({ color: '#FFB3BA', emoji: '👧' }),
        status: EntityStatus.ACTIVE,
      },
    });

    // Alice has existing routine with same name (conflict)
    await prisma.routine.create({
      data: {
        roleId: testRole.id,
        name: 'Test Routine',
        status: EntityStatus.ACTIVE,
        type: 'REGULAR',
        resetPeriod: 'DAILY',
        assignments: {
          create: { personId: personAlice.id },
        },
        tasks: {
          create: [
            { name: 'Existing Task', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
          ],
        },
      },
    });

    personBob = await prisma.person.create({
      data: {
        roleId: testRole.id,
        name: 'Bob',
        avatar: JSON.stringify({ color: '#B3E5FC', emoji: '👦' }),
        status: EntityStatus.ACTIVE,
      },
    });

    // Bob has existing routine with same name (conflict)
    await prisma.routine.create({
      data: {
        roleId: testRole.id,
        name: 'Test Routine',
        status: EntityStatus.ACTIVE,
        type: 'REGULAR',
        resetPeriod: 'DAILY',
        assignments: {
          create: { personId: personBob.id },
        },
        tasks: {
          create: [
            { name: 'Bob Task', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
          ],
        },
      },
    });

    personCharlie = await prisma.person.create({
      data: {
        roleId: testRole.id,
        name: 'Charlie',
        avatar: JSON.stringify({ color: '#FFE5B4', emoji: '👨' }),
        status: EntityStatus.ACTIVE,
      },
    });

    // Charlie has NO existing routine (no conflict)
  });

  afterAll(async () => {
    // Cleanup
    if (testRole) {
      await prisma.task.deleteMany({ where: { routine: { roleId: testRole.id } } });
      await prisma.routineAssignment.deleteMany({ where: { routine: { roleId: testRole.id } } });
      await prisma.routine.deleteMany({ where: { roleId: testRole.id } });
      await prisma.person.deleteMany({ where: { roleId: testRole.id } });
      await prisma.role.delete({ where: { id: testRole.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  describe('Scenario: Copy with different per-person names', () => {
    it('should create routines with different names for Alice and Bob, default name for Charlie', async () => {
      // Input simulating the frontend
      const targetPersonIds = [personAlice.id, personBob.id, personCharlie.id];
      const conflictResolutions = {
        [personAlice.id]: 'rename' as const,
        [personBob.id]: 'rename' as const,
        // Charlie has no conflict, no resolution needed
      };
      const renamedNames = {
        [personAlice.id]: 'Alice Morning Routine',
        [personBob.id]: 'Bob Daily Tasks',
        // Charlie will get default name
      };

      // Simulate backend validation logic
      const personsNeedingRename = targetPersonIds.filter(
        (personId) => conflictResolutions[personId] === 'rename'
      );

      expect(personsNeedingRename).toEqual([personAlice.id, personBob.id]);

      // Build names to validate
      const namesToValidate = new Map<string, string[]>();
      const fallbackName = `${sourceRoutine.name} (Copy)`;

      for (const personId of personsNeedingRename) {
        const renamedName = renamedNames[personId] || fallbackName;
        const existing = namesToValidate.get(renamedName) || [];
        existing.push(personId);
        namesToValidate.set(renamedName, existing);
      }

      // Verify unique names
      expect(namesToValidate.size).toBe(2); // Alice and Bob have different names
      expect(namesToValidate.get('Alice Morning Routine')).toEqual([personAlice.id]);
      expect(namesToValidate.get('Bob Daily Tasks')).toEqual([personBob.id]);

      // Simulate creating routines
      const createdRoutines = [];

      for (const personId of targetPersonIds) {
        const resolution = conflictResolutions[personId];
        const existingRoutine = await prisma.routine.findFirst({
          where: {
            roleId: testRole.id,
            name: sourceRoutine.name,
            status: EntityStatus.ACTIVE,
            assignments: {
              some: { personId },
            },
          },
        });

        // Determine name
        let routineName = sourceRoutine.name;
        if (existingRoutine && resolution === 'rename') {
          routineName = renamedNames[personId] || `${sourceRoutine.name} (Copy)`;
        }

        // Create routine (skip if exists and no resolution - would be an error case)
        if (existingRoutine && !resolution) {
          continue; // Skip - this would be handled as error in real implementation
        }

        const newRoutine = await prisma.routine.create({
          data: {
            roleId: testRole.id,
            name: routineName,
            description: sourceRoutine.description,
            type: sourceRoutine.type,
            resetPeriod: sourceRoutine.resetPeriod,
            status: EntityStatus.ACTIVE,
            assignments: {
              create: { personId },
            },
            tasks: {
              create: [
                { name: 'Task 1', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
                { name: 'Task 2', type: 'SIMPLE', order: 1, status: EntityStatus.ACTIVE },
              ],
            },
          },
        });

        createdRoutines.push({ personId, routine: newRoutine });
      }

      // Verify results
      expect(createdRoutines.length).toBe(3);

      const aliceRoutine = createdRoutines.find((r) => r.personId === personAlice.id);
      expect(aliceRoutine?.routine.name).toBe('Alice Morning Routine');

      const bobRoutine = createdRoutines.find((r) => r.personId === personBob.id);
      expect(bobRoutine?.routine.name).toBe('Bob Daily Tasks');

      const charlieRoutine = createdRoutines.find((r) => r.personId === personCharlie.id);
      expect(charlieRoutine?.routine.name).toBe('Test Routine'); // No conflict, keeps original name
    });
  });

  describe('Scenario: Detect duplicate renamed names', () => {
    it('should detect when two persons try to use the same renamed name', async () => {
      const personsNeedingRename = [personAlice.id, personBob.id];
      const renamedNames = {
        [personAlice.id]: 'Same Name',
        [personBob.id]: 'Same Name', // Duplicate!
      };

      // Build names to validate
      const namesToValidate = new Map<string, string[]>();
      const fallbackName = `${sourceRoutine.name} (Copy)`;

      for (const personId of personsNeedingRename) {
        const renamedName = renamedNames[personId] || fallbackName;
        const existing = namesToValidate.get(renamedName) || [];
        existing.push(personId);
        namesToValidate.set(renamedName, existing);
      }

      // Should have only one entry in map
      expect(namesToValidate.size).toBe(1);
      expect(namesToValidate.get('Same Name')).toEqual([personAlice.id, personBob.id]);

      // In real implementation, we would check for conflicts for BOTH persons
      const conflictCheck = await prisma.routine.findFirst({
        where: {
          roleId: testRole.id,
          name: 'Same Name',
          status: EntityStatus.ACTIVE,
          assignments: {
            some: {
              personId: { in: [personAlice.id, personBob.id] },
            },
          },
        },
      });

      // This would trigger an error in the backend if a conflict exists
      // For this test, we just verify the logic would detect it
      expect(namesToValidate.get('Same Name')?.length).toBeGreaterThan(1);
    });
  });

  describe('Scenario: Use fallback name when no custom name provided', () => {
    it('should use fallback name when renamedNames does not include personId', async () => {
      const personId = personAlice.id;
      const resolution = 'rename' as const;
      const renamedNames = {}; // Empty - no custom name

      const fallbackName = `${sourceRoutine.name} (Copy)`;

      // Determine name
      let routineName = sourceRoutine.name;
      if (resolution === 'rename') {
        routineName = renamedNames[personId] || fallbackName;
      }

      expect(routineName).toBe('Test Routine (Copy)');
    });
  });

  describe('Scenario: Validate against existing routines', () => {
    it('should detect conflict when renamed name already exists for that person', async () => {
      // Alice already has "Test Routine"
      // Try to rename to "Test Routine" again
      const renamedName = 'Test Routine';
      const personId = personAlice.id;

      const existingWithName = await prisma.routine.findFirst({
        where: {
          roleId: testRole.id,
          name: renamedName,
          status: EntityStatus.ACTIVE,
          assignments: {
            some: { personId },
          },
        },
      });

      expect(existingWithName).toBeDefined();
      expect(existingWithName?.name).toBe('Test Routine');

      // This would trigger a TRPCError in the backend
    });

    it('should allow same renamed name for different persons if they each do not have it', async () => {
      // Create a new routine name that neither Alice nor Bob has
      const newName = 'Brand New Routine';

      const aliceHasIt = await prisma.routine.findFirst({
        where: {
          roleId: testRole.id,
          name: newName,
          status: EntityStatus.ACTIVE,
          assignments: { some: { personId: personAlice.id } },
        },
      });

      const bobHasIt = await prisma.routine.findFirst({
        where: {
          roleId: testRole.id,
          name: newName,
          status: EntityStatus.ACTIVE,
          assignments: { some: { personId: personBob.id } },
        },
      });

      expect(aliceHasIt).toBeNull();
      expect(bobHasIt).toBeNull();

      // In this case, backend validation would pass
      // Both Alice and Bob could get routines named "Brand New Routine"
    });
  });
});
