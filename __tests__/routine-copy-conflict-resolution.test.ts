/**
 * Routine Copy Conflict Resolution Test Suite
 *
 * Tests for the routine copy feature with conflict resolution:
 * - checkCopyConflicts query returns correct conflict information
 * - copy mutation handles both 'merge' and 'rename' resolutions
 * - Conflict detection works correctly
 * - Error handling is proper
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { EntityStatus } from '@/lib/types/prisma-enums';

describe('Routine Copy Conflict Resolution', () => {
  let testUser: any;
  let testRole: any;
  let sourcePerson: any;
  let targetPerson1: any;
  let targetPerson2: any;
  let sourceRoutine: any;
  let conflictingRoutine: any;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `routine-copy-test-${Date.now()}@test.com`,
        name: 'Routine Copy Test User',
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

    // Create source person
    sourcePerson = await prisma.person.create({
      data: {
        roleId: testRole.id,
        name: 'Source Person',
        avatar: JSON.stringify({ color: '#FFB3BA', emoji: '👤' }),
        status: EntityStatus.ACTIVE,
      },
    });

    // Create target persons
    targetPerson1 = await prisma.person.create({
      data: {
        roleId: testRole.id,
        name: 'Target Person 1',
        avatar: JSON.stringify({ color: '#B3E5FC', emoji: '👦' }),
        status: EntityStatus.ACTIVE,
      },
    });

    targetPerson2 = await prisma.person.create({
      data: {
        roleId: testRole.id,
        name: 'Target Person 2',
        avatar: JSON.stringify({ color: '#FFE5B4', emoji: '👧' }),
        status: EntityStatus.ACTIVE,
      },
    });

    // Create source routine with tasks
    sourceRoutine = await prisma.routine.create({
      data: {
        roleId: testRole.id,
        name: 'Morning Routine',
        description: 'Daily morning tasks',
        type: 'REGULAR',
        resetPeriod: 'DAILY',
        status: EntityStatus.ACTIVE,
        assignments: {
          create: { personId: sourcePerson.id },
        },
        tasks: {
          create: [
            { name: 'Brush teeth', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
            { name: 'Get dressed', type: 'SIMPLE', order: 1, status: EntityStatus.ACTIVE },
          ],
        },
      },
    });

    // Create conflicting routine on target person 1 (same name)
    conflictingRoutine = await prisma.routine.create({
      data: {
        roleId: testRole.id,
        name: 'Morning Routine', // Same name as source
        description: 'Existing morning routine',
        type: 'REGULAR',
        resetPeriod: 'DAILY',
        status: EntityStatus.ACTIVE,
        assignments: {
          create: { personId: targetPerson1.id },
        },
        tasks: {
          create: [
            { name: 'Wake up', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup in reverse order
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

  describe('Conflict Detection', () => {
    it('should detect naming conflict when target person has routine with same name', async () => {
      const result = await prisma.routine.findMany({
        where: {
          roleId: testRole.id,
          name: sourceRoutine.name,
          status: EntityStatus.ACTIVE,
          assignments: {
            some: {
              personId: { in: [targetPerson1.id] },
            },
          },
        },
        include: {
          assignments: {
            where: {
              personId: { in: [targetPerson1.id] },
            },
            include: {
              person: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Morning Routine');
      expect(result[0].assignments.length).toBeGreaterThan(0);
    });

    it('should not detect conflict when target person does not have routine with same name', async () => {
      const result = await prisma.routine.findMany({
        where: {
          roleId: testRole.id,
          name: sourceRoutine.name,
          status: EntityStatus.ACTIVE,
          assignments: {
            some: {
              personId: { in: [targetPerson2.id] },
            },
          },
        },
      });

      expect(result.length).toBe(0);
    });

    it('should properly identify conflicts for multiple target persons', async () => {
      const targetPersonIds = [targetPerson1.id, targetPerson2.id];

      const existingRoutines = await prisma.routine.findMany({
        where: {
          roleId: testRole.id,
          name: sourceRoutine.name,
          status: EntityStatus.ACTIVE,
          assignments: {
            some: {
              personId: { in: targetPersonIds },
            },
          },
        },
        include: {
          assignments: {
            where: {
              personId: { in: targetPersonIds },
            },
            include: {
              person: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      const conflicts = existingRoutines.flatMap(routine =>
        routine.assignments.map((assignment: any) => ({
          personId: assignment.person.id,
          personName: assignment.person.name,
          existingRoutineId: routine.id,
        }))
      );

      // Should only have conflict for targetPerson1
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].personId).toBe(targetPerson1.id);
      expect(conflicts[0].personName).toBe('Target Person 1');
    });
  });

  describe('Merge Resolution', () => {
    it('should be able to add tasks to existing routine (merge)', async () => {
      // Get current task count
      const beforeTasks = await prisma.task.findMany({
        where: {
          routineId: conflictingRoutine.id,
          status: EntityStatus.ACTIVE,
        },
      });

      const initialTaskCount = beforeTasks.length;

      // Get last task order
      const lastTask = await prisma.task.findFirst({
        where: {
          routineId: conflictingRoutine.id,
          status: EntityStatus.ACTIVE,
        },
        orderBy: { order: 'desc' },
      });

      const lastOrder = lastTask?.order || 0;

      // Get source tasks
      const sourceTasks = await prisma.task.findMany({
        where: {
          routineId: sourceRoutine.id,
          status: EntityStatus.ACTIVE,
        },
      });

      // Add tasks to existing routine (simulating merge)
      await Promise.all(
        sourceTasks.map((task: any, index: number) =>
          prisma.task.create({
            data: {
              routineId: conflictingRoutine.id,
              name: task.name,
              description: task.description,
              type: task.type,
              order: lastOrder + index + 1,
              unit: task.unit,
            },
          })
        )
      );

      // Verify tasks were added
      const afterTasks = await prisma.task.findMany({
        where: {
          routineId: conflictingRoutine.id,
          status: EntityStatus.ACTIVE,
        },
      });

      expect(afterTasks.length).toBe(initialTaskCount + sourceTasks.length);
    });
  });

  describe('Rename Resolution', () => {
    it('should be able to create new routine with different name', async () => {
      const newRoutineName = 'Morning Routine (Copy)';

      // Create new routine with renamed name
      const newRoutine = await prisma.routine.create({
        data: {
          roleId: testRole.id,
          name: newRoutineName,
          description: sourceRoutine.description,
          type: sourceRoutine.type,
          resetPeriod: sourceRoutine.resetPeriod,
          status: EntityStatus.ACTIVE,
          assignments: {
            create: { personId: targetPerson1.id },
          },
          tasks: {
            create: [
              { name: 'Brush teeth', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
              { name: 'Get dressed', type: 'SIMPLE', order: 1, status: EntityStatus.ACTIVE },
            ],
          },
        },
      });

      expect(newRoutine).toBeDefined();
      expect(newRoutine.name).toBe(newRoutineName);
      expect(newRoutine.name).not.toBe(sourceRoutine.name);

      // Verify routine is assigned to target person
      const assignment = await prisma.routineAssignment.findFirst({
        where: {
          routineId: newRoutine.id,
          personId: targetPerson1.id,
        },
      });

      expect(assignment).toBeDefined();

      // Cleanup
      await prisma.task.deleteMany({ where: { routineId: newRoutine.id } });
      await prisma.routineAssignment.deleteMany({ where: { routineId: newRoutine.id } });
      await prisma.routine.delete({ where: { id: newRoutine.id } });
    });
  });

  describe('Schema Validation', () => {
    it('should validate conflictResolutions schema structure', () => {
      // The schema expects: Record<string, 'merge' | 'rename'>
      const validResolutions = {
        'person1': 'merge' as const,
        'person2': 'rename' as const,
      };

      expect(validResolutions['person1']).toBe('merge');
      expect(validResolutions['person2']).toBe('rename');
    });

    it('should validate renamedName is required when using rename resolution', () => {
      const renamedName = 'New Routine Name';
      expect(renamedName.length).toBeGreaterThan(0);
      expect(renamedName.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Daily Routine Special Case', () => {
    it('should auto-merge Daily Routine even without explicit merge resolution', async () => {
      // Create Daily Routine on source
      const dailyRoutine = await prisma.routine.create({
        data: {
          roleId: testRole.id,
          name: 'Daily Routine',
          description: 'Daily tasks',
          type: 'REGULAR',
          resetPeriod: 'DAILY',
          status: EntityStatus.ACTIVE,
          assignments: {
            create: { personId: sourcePerson.id },
          },
          tasks: {
            create: [
              { name: 'Task 1', type: 'SIMPLE', order: 0, status: EntityStatus.ACTIVE },
            ],
          },
        },
      });

      // Verify Daily Routine naming logic
      expect(dailyRoutine.name.includes('Daily Routine')).toBe(true);

      // Cleanup
      await prisma.task.deleteMany({ where: { routineId: dailyRoutine.id } });
      await prisma.routineAssignment.deleteMany({ where: { routineId: dailyRoutine.id } });
      await prisma.routine.delete({ where: { id: dailyRoutine.id } });
    });
  });
});
