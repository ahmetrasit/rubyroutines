import { PrismaClient } from '@prisma/client';
import { RoleType, Tier, EntityStatus, GroupType, RoutineType, TaskType, ResetPeriod, Visibility } from '@/lib/types/prisma-enums';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test users
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@test.com' },
    update: {},
    create: {
      id: 'test-parent-user-id',
      email: 'parent@test.com',
      name: 'Test Parent',
      emailVerified: new Date(),
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      id: 'test-teacher-user-id',
      email: 'teacher@test.com',
      name: 'Test Teacher',
      emailVerified: new Date(),
    },
  });

  const principalUser = await prisma.user.upsert({
    where: { email: 'principal@test.com' },
    update: {},
    create: {
      id: 'test-principal-user-id',
      email: 'principal@test.com',
      name: 'Test Principal',
      emailVerified: new Date(),
    },
  });

  console.log('Created test users');

  // Create roles
  const parentRole = await prisma.role.upsert({
    where: { userId_type: { userId: parentUser.id, type: RoleType.PARENT } },
    update: {},
    create: {
      userId: parentUser.id,
      type: RoleType.PARENT,
      tier: Tier.FREE,
    },
  });

  const teacherRole = await prisma.role.upsert({
    where: { userId_type: { userId: teacherUser.id, type: RoleType.TEACHER } },
    update: {},
    create: {
      userId: teacherUser.id,
      type: RoleType.TEACHER,
      tier: Tier.BASIC,
    },
  });

  const principalRole = await prisma.role.upsert({
    where: { userId_type: { userId: principalUser.id, type: RoleType.PRINCIPAL } },
    update: {},
    create: {
      userId: principalUser.id,
      type: RoleType.PRINCIPAL,
      tier: Tier.SCHOOL,
    },
  });

  console.log('Created roles');

  // Create children for parent
  const child1 = await prisma.person.upsert({
    where: { id: 'test-child-1' },
    update: {},
    create: {
      id: 'test-child-1',
      roleId: parentRole.id,
      name: 'Emma Johnson',
      birthDate: new Date('2018-05-15'),
      status: EntityStatus.ACTIVE,
    },
  });

  const child2 = await prisma.person.upsert({
    where: { id: 'test-child-2' },
    update: {},
    create: {
      id: 'test-child-2',
      roleId: parentRole.id,
      name: 'Liam Johnson',
      birthDate: new Date('2020-08-22'),
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('Created children');

  // Create students for teacher
  const student1 = await prisma.person.upsert({
    where: { id: 'test-student-1' },
    update: {},
    create: {
      id: 'test-student-1',
      roleId: teacherRole.id,
      name: 'Sophia Martinez',
      birthDate: new Date('2017-03-10'),
      status: EntityStatus.ACTIVE,
    },
  });

  const student2 = await prisma.person.upsert({
    where: { id: 'test-student-2' },
    update: {},
    create: {
      id: 'test-student-2',
      roleId: teacherRole.id,
      name: 'Noah Chen',
      birthDate: new Date('2017-11-25'),
      status: EntityStatus.ACTIVE,
    },
  });

  const student3 = await prisma.person.upsert({
    where: { id: 'test-student-3' },
    update: {},
    create: {
      id: 'test-student-3',
      roleId: teacherRole.id,
      name: 'Olivia Brown',
      birthDate: new Date('2018-01-30'),
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('Created students');

  // Create family group
  const familyGroup = await prisma.group.upsert({
    where: { id: 'test-family-group' },
    update: {},
    create: {
      id: 'test-family-group',
      roleId: parentRole.id,
      name: 'Johnson Family',
      type: GroupType.FAMILY,
      status: EntityStatus.ACTIVE,
    },
  });

  // Add children to family
  await prisma.groupMember.upsert({
    where: { id: 'test-family-member-1' },
    update: {},
    create: {
      id: 'test-family-member-1',
      groupId: familyGroup.id,
      personId: child1.id,
    },
  });

  await prisma.groupMember.upsert({
    where: { id: 'test-family-member-2' },
    update: {},
    create: {
      id: 'test-family-member-2',
      groupId: familyGroup.id,
      personId: child2.id,
    },
  });

  console.log('Created family group');

  // Create classroom group
  const classroomGroup = await prisma.group.upsert({
    where: { id: 'test-classroom-group' },
    update: {},
    create: {
      id: 'test-classroom-group',
      roleId: teacherRole.id,
      name: '1st Grade - Room 101',
      type: GroupType.CLASSROOM,
      status: EntityStatus.ACTIVE,
    },
  });

  // Add students to classroom
  await prisma.groupMember.upsert({
    where: { id: 'test-classroom-member-1' },
    update: {},
    create: {
      id: 'test-classroom-member-1',
      groupId: classroomGroup.id,
      personId: student1.id,
    },
  });

  await prisma.groupMember.upsert({
    where: { id: 'test-classroom-member-2' },
    update: {},
    create: {
      id: 'test-classroom-member-2',
      groupId: classroomGroup.id,
      personId: student2.id,
    },
  });

  await prisma.groupMember.upsert({
    where: { id: 'test-classroom-member-3' },
    update: {},
    create: {
      id: 'test-classroom-member-3',
      groupId: classroomGroup.id,
      personId: student3.id,
    },
  });

  console.log('Created classroom group');

  // Create morning routine for parent
  const morningRoutine = await prisma.routine.upsert({
    where: { id: 'test-routine-morning' },
    update: {},
    create: {
      id: 'test-routine-morning',
      roleId: parentRole.id,
      name: 'Morning Routine',
      description: 'Get ready for school',
      type: RoutineType.REGULAR,
      resetPeriod: ResetPeriod.DAILY,
      visibility: Visibility.ALWAYS,
      visibleDays: [],
      status: EntityStatus.ACTIVE,
    },
  });

  // Assign routine to child
  await prisma.routineAssignment.upsert({
    where: { id: 'test-routine-assignment-1' },
    update: {},
    create: {
      id: 'test-routine-assignment-1',
      routineId: morningRoutine.id,
      personId: child1.id,
    },
  });

  console.log('Created morning routine');

  // Create tasks for morning routine
  const task1 = await prisma.task.upsert({
    where: { id: 'test-task-1' },
    update: {},
    create: {
      id: 'test-task-1',
      routineId: morningRoutine.id,
      name: 'Brush Teeth',
      description: 'Brush for 2 minutes',
      type: TaskType.SIMPLE,
      order: 1,
      status: EntityStatus.ACTIVE,
    },
  });

  const task2 = await prisma.task.upsert({
    where: { id: 'test-task-2' },
    update: {},
    create: {
      id: 'test-task-2',
      routineId: morningRoutine.id,
      name: 'Get Dressed',
      description: 'Put on school clothes',
      type: TaskType.SIMPLE,
      order: 2,
      status: EntityStatus.ACTIVE,
    },
  });

  const task3 = await prisma.task.upsert({
    where: { id: 'test-task-3' },
    update: {},
    create: {
      id: 'test-task-3',
      routineId: morningRoutine.id,
      name: 'Eat Breakfast',
      description: 'Finish your meal',
      type: TaskType.SIMPLE,
      order: 3,
      status: EntityStatus.ACTIVE,
    },
  });

  const task4 = await prisma.task.upsert({
    where: { id: 'test-task-4' },
    update: {},
    create: {
      id: 'test-task-4',
      routineId: morningRoutine.id,
      name: 'Pack Backpack',
      description: 'Get ready for school',
      type: TaskType.SIMPLE,
      order: 4,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('Created morning routine tasks');

  // Create classroom routine for teacher
  const classroomRoutine = await prisma.routine.upsert({
    where: { id: 'test-routine-classroom' },
    update: {},
    create: {
      id: 'test-routine-classroom',
      roleId: teacherRole.id,
      name: 'Reading Time Setup',
      description: 'Prepare for reading group',
      type: RoutineType.TEACHER_CLASSROOM,
      resetPeriod: ResetPeriod.DAILY,
      visibility: Visibility.ALWAYS,
      visibleDays: [],
      status: EntityStatus.ACTIVE,
    },
  });

  // Assign to student
  await prisma.routineAssignment.upsert({
    where: { id: 'test-routine-assignment-2' },
    update: {},
    create: {
      id: 'test-routine-assignment-2',
      routineId: classroomRoutine.id,
      personId: student1.id,
    },
  });

  // Create classroom tasks
  await prisma.task.upsert({
    where: { id: 'test-task-5' },
    update: {},
    create: {
      id: 'test-task-5',
      routineId: classroomRoutine.id,
      name: 'Get Reading Book',
      description: 'Pick your book from shelf',
      type: TaskType.SIMPLE,
      order: 1,
      status: EntityStatus.ACTIVE,
    },
  });

  await prisma.task.upsert({
    where: { id: 'test-task-6' },
    update: {},
    create: {
      id: 'test-task-6',
      routineId: classroomRoutine.id,
      name: 'Sit in Reading Circle',
      description: 'Find your spot quietly',
      type: TaskType.SIMPLE,
      order: 2,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('Created classroom routine and tasks');

  // Create a goal for child
  await prisma.goal.upsert({
    where: { id: 'test-goal-1' },
    update: {},
    create: {
      id: 'test-goal-1',
      roleId: parentRole.id,
      personIds: [child1.id],
      name: 'Complete Morning Routine 7 Days',
      description: 'Finish all morning tasks for a full week',
      target: 7, // 7 days
      period: ResetPeriod.WEEKLY,
      status: EntityStatus.ACTIVE,
    },
  });

  console.log('Created goal');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
