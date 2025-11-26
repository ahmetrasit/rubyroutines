import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to add protected "Daily Routine" for existing persons who don't have one
 * This ensures all persons have the default routine that cannot be deleted or renamed
 */
async function addDailyRoutines() {
  try {
    console.log('🔍 Finding persons without Daily Routine...\n');

    // Get all active persons with their routines
    const persons = await prisma.person.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        assignments: {
          where: {
            routine: {
              status: 'ACTIVE',
            },
          },
          include: {
            routine: true,
          },
        },
        role: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    console.log(`Found ${persons.length} active persons\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const person of persons) {
      // Check if person already has a "Daily Routine"
      const hasDailyRoutine = person.assignments.some(
        (assignment) => assignment.routine.name.includes('Daily Routine')
      );

      if (hasDailyRoutine) {
        console.log(`✓ Person "${person.name}" (${person.id}) already has Daily Routine - skipping`);
        skippedCount++;
        continue;
      }

      // Create the protected Daily Routine
      console.log(`➕ Creating Daily Routine for person "${person.name}" (${person.id})...`);

      const routine = await prisma.routine.create({
        data: {
          roleId: person.roleId,
          name: '☀️ Daily Routine',
          description: 'Default routine for daily tasks',
          resetPeriod: 'DAILY',
          color: '#3B82F6',
          isProtected: true, // Cannot be deleted or renamed
          status: 'ACTIVE',
          assignments: {
            create: {
              personId: person.id,
            },
          },
        },
      });

      console.log(`  ✓ Created routine ${routine.id} for person "${person.name}"`);
      createdCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`  • Total persons processed: ${persons.length}`);
    console.log(`  • Daily Routines created: ${createdCount}`);
    console.log(`  • Persons skipped (already have Daily Routine): ${skippedCount}`);
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error adding daily routines:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDailyRoutines();
