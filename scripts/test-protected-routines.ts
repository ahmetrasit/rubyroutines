import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProtectedRoutines() {
  console.log('🧪 Testing Protected Routine Functionality\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Verify schema has isProtected field
    console.log('\n✅ TEST 1: Verify schema has isProtected field');
    const sampleRoutine = await prisma.routine.findFirst({
      select: { id: true, name: true, isProtected: true, status: true }
    });
    if (sampleRoutine && 'isProtected' in sampleRoutine) {
      console.log('   ✓ Schema has isProtected field');
      console.log(`   Sample: ${sampleRoutine.name} (protected: ${sampleRoutine.isProtected})`);
    } else {
      console.log('   ✗ Schema missing isProtected field!');
    }

    // Test 2: Count protected routines
    console.log('\n✅ TEST 2: Count protected routines');
    const protectedCount = await prisma.routine.count({
      where: { isProtected: true, status: 'ACTIVE' }
    });
    const totalCount = await prisma.routine.count({
      where: { status: 'ACTIVE' }
    });
    console.log(`   ✓ Found ${protectedCount} protected routines out of ${totalCount} total active routines`);

    // Test 3: Verify all Daily Routines are protected
    console.log('\n✅ TEST 3: Verify Daily Routines are protected');
    const dailyRoutines = await prisma.routine.findMany({
      where: {
        name: { contains: 'Daily Routine' },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        isProtected: true,
        roleId: true
      },
      take: 10
    });

    const allProtected = dailyRoutines.every(r => r.isProtected);
    if (allProtected && dailyRoutines.length > 0) {
      console.log(`   ✓ All ${dailyRoutines.length} Daily Routines are protected`);
    } else if (dailyRoutines.length === 0) {
      console.log('   ⚠ No Daily Routines found');
    } else {
      console.log('   ✗ Some Daily Routines are NOT protected!');
      dailyRoutines.filter(r => !r.isProtected).forEach(r => {
        console.log(`     - ${r.name} (${r.id}) is NOT protected`);
      });
    }

    // Test 4: Verify each active person has a Daily Routine
    console.log('\n✅ TEST 4: Verify persons have Daily Routines');
    const persons = await prisma.person.findMany({
      where: { status: 'ACTIVE' },
      include: {
        assignments: {
          where: {
            routine: {
              name: { contains: 'Daily Routine' },
              status: 'ACTIVE'
            }
          },
          include: {
            routine: {
              select: {
                id: true,
                name: true,
                isProtected: true
              }
            }
          }
        }
      },
      take: 10
    });

    const personsWithDailyRoutine = persons.filter(p => p.assignments.length > 0);
    const personsWithoutDailyRoutine = persons.filter(p => p.assignments.length === 0);

    console.log(`   ✓ ${personsWithDailyRoutine.length} persons have Daily Routines`);
    if (personsWithoutDailyRoutine.length > 0) {
      console.log(`   ⚠ ${personsWithoutDailyRoutine.length} persons DON'T have Daily Routines:`);
      personsWithoutDailyRoutine.slice(0, 5).forEach(p => {
        console.log(`     - ${p.name} (${p.id})`);
      });
    }

    // Test 5: Check migration was applied
    console.log('\n✅ TEST 5: Verify migration was applied');
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routines' AND column_name = 'isProtected'
      );
    `;
    if (result[0]?.exists) {
      console.log('   ✓ Migration applied: isProtected column exists');
    } else {
      console.log('   ✗ Migration NOT applied: isProtected column missing!');
    }

    // Test 6: Check index exists
    console.log('\n✅ TEST 6: Verify index was created');
    const indexResult = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'routines' AND indexname = 'routines_isProtected_idx'
      );
    `;
    if (indexResult[0]?.exists) {
      console.log('   ✓ Index created: routines_isProtected_idx');
    } else {
      console.log('   ✗ Index NOT created!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testProtectedRoutines();
