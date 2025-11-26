import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProtectedRoutineIntegration() {
  console.log('🧪 Testing Protected Routine Integration\n');
  console.log('='.repeat(70));

  try {
    // Find a protected routine to test with
    const protectedRoutine = await prisma.routine.findFirst({
      where: { isProtected: true },
      select: { id: true, name: true, description: true, color: true }
    });

    if (!protectedRoutine) {
      console.log('❌ No protected routines found to test with!');
      return;
    }

    console.log(`\n📋 Testing with routine: "${protectedRoutine.name}" (ID: ${protectedRoutine.id})`);

    // TEST 1: Try to change color and description (SHOULD SUCCEED)
    console.log('\n✅ TEST 1: Update color and description of protected routine');
    try {
      const updated = await prisma.routine.update({
        where: { id: protectedRoutine.id },
        data: {
          color: '#FF5733',
          description: 'Updated description for testing'
        }
      });
      console.log('   ✓ Successfully updated color and description');
      console.log(`     New color: ${updated.color}`);
      console.log(`     New description: ${updated.description}`);

      // Restore original values
      await prisma.routine.update({
        where: { id: protectedRoutine.id },
        data: {
          color: protectedRoutine.color,
          description: protectedRoutine.description
        }
      });
      console.log('   ✓ Restored original values');
    } catch (error: any) {
      console.log('   ✗ Failed to update color/description:', error.message);
    }

    // TEST 2: Try to change name (SHOULD FAIL - caught by application logic, not database)
    console.log('\n✅ TEST 2: Attempt to rename protected routine');
    console.log('   ⚠ Note: This test just shows the database allows it');
    console.log('   ⚠ Application code in routine.ts should prevent this');
    try {
      const attempt = await prisma.routine.update({
        where: { id: protectedRoutine.id },
        data: { name: 'Test Renamed' }
      });
      console.log('   ✓ Database allowed rename (application should block this)');

      // Immediately restore
      await prisma.routine.update({
        where: { id: protectedRoutine.id },
        data: { name: protectedRoutine.name }
      });
      console.log('   ✓ Restored original name');
    } catch (error: any) {
      console.log('   ✗ Database blocked rename:', error.message);
    }

    // TEST 3: Try to delete (SHOULD FAIL - caught by application logic, not database)
    console.log('\n✅ TEST 3: Attempt to delete protected routine');
    console.log('   ⚠ Note: This test just shows the database allows it');
    console.log('   ⚠ Application code in routine.ts should prevent this');
    try {
      // We won't actually delete, just check if we can set status to INACTIVE
      const softDelete = await prisma.routine.update({
        where: { id: protectedRoutine.id },
        data: { status: 'INACTIVE', archivedAt: new Date() }
      });
      console.log('   ✓ Database allowed soft delete (application should block this)');

      // Immediately restore
      await prisma.routine.update({
        where: { id: protectedRoutine.id },
        data: { status: 'ACTIVE', archivedAt: null }
      });
      console.log('   ✓ Restored active status');
    } catch (error: any) {
      console.log('   ✗ Database blocked deletion:', error.message);
    }

    // TEST 4: Verify new persons get protected Daily Routine
    console.log('\n✅ TEST 4: Verify person creation includes protected Daily Routine');

    // Get a test role
    const role = await prisma.role.findFirst({
      where: { type: 'PARENT' },
      select: { id: true, type: true }
    });

    if (!role) {
      console.log('   ⚠ No PARENT role found to test with');
    } else {
      console.log('   ℹ This test should be done through the TRPC endpoint');
      console.log('   ℹ The person.ts router should create a protected Daily Routine');
      console.log('   ℹ Check lines 390-406 in lib/trpc/routers/person.ts');
    }

    // TEST 5: Check that all existing Daily Routines are marked as protected
    console.log('\n✅ TEST 5: Verify all Daily Routines are marked as protected');
    const unprotectedDailyRoutines = await prisma.routine.findMany({
      where: {
        name: { contains: 'Daily Routine' },
        isProtected: false,
        status: 'ACTIVE'
      },
      select: { id: true, name: true, isProtected: true }
    });

    if (unprotectedDailyRoutines.length === 0) {
      console.log('   ✓ All Daily Routines are properly protected');
    } else {
      console.log(`   ✗ Found ${unprotectedDailyRoutines.length} unprotected Daily Routines:`);
      unprotectedDailyRoutines.forEach(r => {
        console.log(`     - ${r.name} (${r.id})`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Integration tests completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testProtectedRoutineIntegration();
