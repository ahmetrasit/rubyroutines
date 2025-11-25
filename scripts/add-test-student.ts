#!/usr/bin/env npx tsx
/**
 * Script to add a test student to teacher roles that have no students
 * Run with: npx tsx scripts/add-test-student.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎓 Adding test students to teacher roles...\n');

  // Find teacher roles with no non-owner persons
  const teacherRoles = await prisma.role.findMany({
    where: {
      type: 'TEACHER',
      persons: {
        every: {
          isAccountOwner: true
        }
      }
    },
    include: {
      user: {
        select: { email: true, name: true }
      },
      persons: true,
      groups: {
        where: { type: 'CLASSROOM' }
      }
    }
  });

  if (teacherRoles.length === 0) {
    console.log('✅ All teacher roles already have students');
    return;
  }

  console.log(`Found ${teacherRoles.length} teacher role(s) without students:\n`);

  for (const role of teacherRoles) {
    console.log(`Teacher: ${role.user.name || role.user.email}`);
    console.log(`Role ID: ${role.id}`);

    // Create a test student
    const student = await prisma.person.create({
      data: {
        roleId: role.id,
        name: 'Test Student',
        avatar: JSON.stringify({
          color: '#FFB3BA',
          emoji: '🎒'
        }),
        isAccountOwner: false,
        status: 'ACTIVE'
      }
    });

    console.log(`✅ Created student: ${student.name} (ID: ${student.id})`);

    // If there's a classroom, add the student to it
    const classroom = role.groups[0];
    if (classroom) {
      await prisma.groupMember.create({
        data: {
          groupId: classroom.id,
          personId: student.id,
          role: 'member'
        }
      });
      console.log(`   Added to classroom: ${classroom.name}`);
    }

    // Create a daily routine for the student
    const routine = await prisma.routine.create({
      data: {
        roleId: role.id,
        name: '📚 School Tasks',
        description: 'Daily school activities',
        resetPeriod: 'DAILY',
        color: '#3B82F6',
        status: 'ACTIVE',
        assignments: {
          create: {
            personId: student.id
          }
        }
      }
    });

    console.log(`   Created routine: ${routine.name}`);

    // Add some sample tasks
    const tasks = [
      { name: 'Morning Reading', order: 1, emoji: '📖' },
      { name: 'Math Practice', order: 2, emoji: '🔢' },
      { name: 'Science Project', order: 3, emoji: '🔬' },
      { name: 'Art Activity', order: 4, emoji: '🎨' },
      { name: 'Homework Complete', order: 5, emoji: '✅' }
    ];

    for (const taskData of tasks) {
      await prisma.task.create({
        data: {
          routineId: routine.id,
          name: taskData.name,
          order: taskData.order,
          emoji: taskData.emoji,
          type: 'SIMPLE',
          status: 'ACTIVE'
        }
      });
    }

    console.log(`   Added ${tasks.length} sample tasks`);
    console.log();
  }

  console.log('✅ Done! Teachers can now use kiosk mode with the test student.');
  console.log('\n💡 Next steps:');
  console.log('   1. Generate a new kiosk code from the teacher dashboard');
  console.log('   2. The kiosk will now show "Test Student" for selection');
  console.log('   3. Teachers can rename or add more students as needed');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });