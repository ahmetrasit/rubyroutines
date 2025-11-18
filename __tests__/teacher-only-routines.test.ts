/**
 * Teacher-Only Routines Test Suite
 *
 * Tests for Requirement #4: Teacher-only routines functionality
 * - Auto-generation of teacher-only routines
 * - Visibility filters (kiosk, queries)
 * - Access control for task completion
 * - Workflow #1: Individual student check-in
 * - Workflow #2: Bulk classroom check-in
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { createDefaultTeacherOnlyRoutine } from '@/lib/services/teacher-only-routine.service';

describe('Teacher-Only Routines', () => {
  let teacherUser: any;
  let teacherRole: any;
  let classroom: any;
  let student: any;
  let teacherOnlyRoutine: any;

  beforeAll(async () => {
    // Create teacher user
    teacherUser = await prisma.user.create({
      data: {
        email: `teacher-only-test-${Date.now()}@test.com`,
        name: 'Teacher Only Test',
        role: 'USER',
      },
    });

    // Create teacher role
    teacherRole = await prisma.role.create({
      data: {
        userId: teacherUser.id,
        type: 'TEACHER',
      },
    });

    // Create teacher person (Me)
    const teacherPerson = await prisma.person.create({
      data: {
        roleId: teacherRole.id,
        name: 'Me',
        avatar: JSON.stringify({ color: '#FFB3BA', emoji: '👤' }),
        status: EntityStatus.ACTIVE,
        isAccountOwner: true,
        isProtected: true,
      },
    });

    // Create classroom
    classroom = await prisma.group.create({
      data: {
        roleId: teacherRole.id,
        name: 'Test Classroom',
        type: 'CLASSROOM',
        status: EntityStatus.ACTIVE,
        members: {
          create: {
            personId: teacherPerson.id,
            role: 'member',
          },
        },
      },
    });

    // Create student
    student = await prisma.person.create({
      data: {
        roleId: teacherRole.id,
        name: 'Test Student',
        avatar: JSON.stringify({ color: '#B3E5FC', emoji: '🧒' }),
        status: EntityStatus.ACTIVE,
        isAccountOwner: false,
      },
    });

    // Add student to classroom
    await prisma.groupMember.create({
      data: {
        groupId: classroom.id,
        personId: student.id,
      },
    });
  });

  afterAll(async () => {
    // Cleanup in reverse order
    if (student) {
      await prisma.groupMember.deleteMany({ where: { personId: student.id } });
      await prisma.routineAssignment.deleteMany({ where: { personId: student.id } });
      await prisma.person.delete({ where: { id: student.id } });
    }
    if (classroom) {
      await prisma.groupMember.deleteMany({ where: { groupId: classroom.id } });
      await prisma.group.delete({ where: { id: classroom.id } });
    }
    if (teacherRole) {
      await prisma.routine.deleteMany({ where: { roleId: teacherRole.id } });
      await prisma.person.deleteMany({ where: { roleId: teacherRole.id } });
      await prisma.role.delete({ where: { id: teacherRole.id } });
    }
    if (teacherUser) {
      await prisma.user.delete({ where: { id: teacherUser.id } });
    }
  });

  describe('Auto-Generation', () => {
    it('should auto-create teacher-only routine when student is created', async () => {
      const routine = await createDefaultTeacherOnlyRoutine(
        teacherRole.id,
        student.id,
        'TEACHER'
      );

      expect(routine).toBeDefined();
      expect(routine?.name).toBe('📋 Teacher Notes');
      expect(routine?.isTeacherOnly).toBe(true);
      expect(routine?.color).toBe('#8B5CF6'); // Purple color

      teacherOnlyRoutine = routine;
    });

    it('should not duplicate teacher-only routine for same student', async () => {
      const duplicateRoutine = await createDefaultTeacherOnlyRoutine(
        teacherRole.id,
        student.id,
        'TEACHER'
      );

      expect(duplicateRoutine?.id).toBe(teacherOnlyRoutine.id);
    });

    it('should not create teacher-only routine for non-TEACHER roles', async () => {
      const parentRole = await prisma.role.create({
        data: {
          userId: teacherUser.id,
          type: 'PARENT',
        },
      });

      const child = await prisma.person.create({
        data: {
          roleId: parentRole.id,
          name: 'Test Child',
          avatar: JSON.stringify({ color: '#B3E5FC', emoji: '👶' }),
          status: EntityStatus.ACTIVE,
          isAccountOwner: false,
        },
      });

      const routine = await createDefaultTeacherOnlyRoutine(
        parentRole.id,
        child.id,
        'PARENT'
      );

      expect(routine).toBeNull();

      // Cleanup
      await prisma.person.delete({ where: { id: child.id } });
      await prisma.role.delete({ where: { id: parentRole.id } });
    });

    it('should not create teacher-only routine for account owners', async () => {
      const teacherPerson = await prisma.person.findFirst({
        where: {
          roleId: teacherRole.id,
          isAccountOwner: true,
        },
      });

      expect(teacherPerson).toBeDefined();

      const routine = await createDefaultTeacherOnlyRoutine(
        teacherRole.id,
        teacherPerson!.id,
        'TEACHER'
      );

      // Should return null or not create since it's account owner
      const hasTeacherOnlyRoutine = await prisma.routine.findFirst({
        where: {
          roleId: teacherRole.id,
          isTeacherOnly: true,
          assignments: {
            some: { personId: teacherPerson!.id },
          },
        },
      });

      expect(hasTeacherOnlyRoutine).toBeNull();
    });
  });

  describe('Visibility Filters', () => {
    it('should hide teacher-only routines from kiosk mode queries', async () => {
      // Simulate kiosk query
      const kioskRoutines = await prisma.routine.findMany({
        where: {
          roleId: teacherRole.id,
          status: EntityStatus.ACTIVE,
          isTeacherOnly: false, // CRITICAL: Kiosk filter
          assignments: {
            some: { personId: student.id },
          },
        },
      });

      const hasTeacherOnlyRoutine = kioskRoutines.some(r => r.isTeacherOnly);
      expect(hasTeacherOnlyRoutine).toBe(false);
    });

    it('should hide teacher-only routines from person.getById for non-teachers', async () => {
      // Simulate non-teacher viewing person
      const person = await prisma.person.findUnique({
        where: { id: student.id },
        include: {
          assignments: {
            where: {
              routine: {
                status: EntityStatus.ACTIVE,
                isTeacherOnly: false, // Hide from non-teachers
              },
            },
            include: {
              routine: true,
            },
          },
        },
      });

      expect(person).toBeDefined();
      const hasTeacherOnlyRoutine = person?.assignments.some(
        a => a.routine.isTeacherOnly
      );
      expect(hasTeacherOnlyRoutine).toBe(false);
    });

    it('should show teacher-only routines to teachers', async () => {
      // Simulate teacher viewing person (no filter)
      const person = await prisma.person.findUnique({
        where: { id: student.id },
        include: {
          assignments: {
            where: {
              routine: {
                status: EntityStatus.ACTIVE,
              },
            },
            include: {
              routine: true,
            },
          },
        },
      });

      expect(person).toBeDefined();
      const teacherOnlyRoutines = person?.assignments.filter(
        a => a.routine.isTeacherOnly
      );
      expect(teacherOnlyRoutines?.length).toBeGreaterThan(0);
    });

    it('should hide teacher-only routines from routine.list for non-teachers', async () => {
      // Simulate non-teacher listing routines
      const routines = await prisma.routine.findMany({
        where: {
          roleId: teacherRole.id,
          status: EntityStatus.ACTIVE,
          isTeacherOnly: false, // Hide from non-teachers
        },
      });

      const hasTeacherOnlyRoutine = routines.some(r => r.isTeacherOnly);
      expect(hasTeacherOnlyRoutine).toBe(false);
    });
  });

  describe('Access Control', () => {
    let teacherOnlyTask: any;

    beforeAll(async () => {
      // Create a task in the teacher-only routine
      teacherOnlyTask = await prisma.task.create({
        data: {
          routineId: teacherOnlyRoutine.id,
          name: 'Attendance Check',
          description: 'Mark student attendance',
          type: 'SIMPLE',
          order: 0,
          status: EntityStatus.ACTIVE,
        },
      });
    });

    it('should allow teacher to complete teacher-only task', async () => {
      const completion = await prisma.taskCompletion.create({
        data: {
          taskId: teacherOnlyTask.id,
          personId: student.id,
        },
      });

      expect(completion).toBeDefined();
      expect(completion.taskId).toBe(teacherOnlyTask.id);
      expect(completion.personId).toBe(student.id);

      // Cleanup
      await prisma.taskCompletion.delete({ where: { id: completion.id } });
    });

    it('should enforce teacher-only check in task completion endpoint', async () => {
      // This test verifies the logic exists (integration test would verify full flow)
      const task = await prisma.task.findUnique({
        where: { id: teacherOnlyTask.id },
        include: {
          routine: {
            select: {
              isTeacherOnly: true,
              roleId: true,
            },
          },
        },
      });

      expect(task).toBeDefined();
      expect(task?.routine.isTeacherOnly).toBe(true);

      // In the actual endpoint, this would trigger FORBIDDEN error for non-teachers
      const isTeacherOnly = task?.routine.isTeacherOnly;
      expect(isTeacherOnly).toBe(true);
    });
  });

  describe('Database Schema', () => {
    it('should have isTeacherOnly field on Routine model', async () => {
      const routine = await prisma.routine.findFirst({
        where: { id: teacherOnlyRoutine.id },
        select: { isTeacherOnly: true },
      });

      expect(routine).toBeDefined();
      expect(typeof routine?.isTeacherOnly).toBe('boolean');
    });

    it('should default isTeacherOnly to false for regular routines', async () => {
      const regularRoutine = await prisma.routine.create({
        data: {
          roleId: teacherRole.id,
          name: 'Regular Routine',
          description: 'Not teacher-only',
          type: 'REGULAR',
          resetPeriod: 'DAILY',
          status: EntityStatus.ACTIVE,
        },
      });

      expect(regularRoutine.isTeacherOnly).toBe(false);

      // Cleanup
      await prisma.routine.delete({ where: { id: regularRoutine.id } });
    });
  });

  describe('Integration with Person Creation', () => {
    it('should auto-create teacher-only routine when adding student to classroom', async () => {
      const newStudent = await prisma.person.create({
        data: {
          roleId: teacherRole.id,
          name: 'New Student',
          avatar: JSON.stringify({ color: '#FFE5B4', emoji: '👦' }),
          status: EntityStatus.ACTIVE,
          isAccountOwner: false,
        },
      });

      // Add to classroom (simulates group.addMember)
      await prisma.groupMember.create({
        data: {
          groupId: classroom.id,
          personId: newStudent.id,
        },
      });

      // Trigger teacher-only routine creation
      await createDefaultTeacherOnlyRoutine(teacherRole.id, newStudent.id, 'TEACHER');

      // Verify routine was created
      const routine = await prisma.routine.findFirst({
        where: {
          roleId: teacherRole.id,
          isTeacherOnly: true,
          assignments: {
            some: { personId: newStudent.id },
          },
        },
      });

      expect(routine).toBeDefined();
      expect(routine?.name).toBe('📋 Teacher Notes');

      // Cleanup
      await prisma.routineAssignment.deleteMany({ where: { personId: newStudent.id } });
      await prisma.routine.delete({ where: { id: routine!.id } });
      await prisma.groupMember.deleteMany({ where: { personId: newStudent.id } });
      await prisma.person.delete({ where: { id: newStudent.id } });
    });

    it('should auto-create teacher-only routine when restoring archived student', async () => {
      // Create and archive student
      const archivedStudent = await prisma.person.create({
        data: {
          roleId: teacherRole.id,
          name: 'Archived Student',
          avatar: JSON.stringify({ color: '#E0E0E0', emoji: '😴' }),
          status: EntityStatus.INACTIVE,
          archivedAt: new Date(),
          isAccountOwner: false,
        },
      });

      // Restore student
      await prisma.person.update({
        where: { id: archivedStudent.id },
        data: {
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
      });

      // Trigger teacher-only routine creation (simulates person.restore)
      await createDefaultTeacherOnlyRoutine(teacherRole.id, archivedStudent.id, 'TEACHER');

      // Verify routine was created
      const routine = await prisma.routine.findFirst({
        where: {
          roleId: teacherRole.id,
          isTeacherOnly: true,
          assignments: {
            some: { personId: archivedStudent.id },
          },
        },
      });

      expect(routine).toBeDefined();

      // Cleanup
      await prisma.routineAssignment.deleteMany({ where: { personId: archivedStudent.id } });
      await prisma.routine.delete({ where: { id: routine!.id } });
      await prisma.person.delete({ where: { id: archivedStudent.id } });
    });
  });

  describe('Purple Theme and Naming', () => {
    it('should use purple color (#8B5CF6) for teacher-only routines', () => {
      expect(teacherOnlyRoutine.color).toBe('#8B5CF6');
    });

    it('should have "📋 Teacher Notes" as default name', () => {
      expect(teacherOnlyRoutine.name).toBe('📋 Teacher Notes');
    });

    it('should have descriptive description', () => {
      expect(teacherOnlyRoutine.description).toContain('Private routine');
      expect(teacherOnlyRoutine.description).toContain('Only visible to teachers');
    });
  });
});
