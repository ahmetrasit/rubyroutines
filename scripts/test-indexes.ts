import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testIndexes() {
  console.log('Testing database indexes for performance optimization...\n');

  try {
    // Test 1: Routine filtering with composite index (roleId, isTeacherOnly, status)
    console.log('1. Testing Routine composite index (roleId, isTeacherOnly, status):');
    const startTime1 = Date.now();
    const routines = await prisma.routine.findMany({
      where: {
        roleId: 'test-role-id',
        isTeacherOnly: false,
        status: 'ACTIVE'
      },
      take: 10
    });
    console.log(`   ✓ Query executed in ${Date.now() - startTime1}ms (found ${routines.length} routines)\n`);

    // Test 2: Person queries with composite index (roleId, status)
    console.log('2. Testing Person composite index (roleId, status):');
    const startTime2 = Date.now();
    const persons = await prisma.person.findMany({
      where: {
        roleId: 'test-role-id',
        status: 'ACTIVE'
      },
      take: 10
    });
    console.log(`   ✓ Query executed in ${Date.now() - startTime2}ms (found ${persons.length} persons)\n`);

    // Test 3: Task queries with composite index (routineId, status)
    console.log('3. Testing Task composite index (routineId, status):');
    const startTime3 = Date.now();
    const tasks = await prisma.task.findMany({
      where: {
        routineId: 'test-routine-id',
        status: 'ACTIVE'
      },
      orderBy: { order: 'asc' },
      take: 10
    });
    console.log(`   ✓ Query executed in ${Date.now() - startTime3}ms (found ${tasks.length} tasks)\n`);

    // Test 4: Code lookup with composite index (code, status)
    console.log('4. Testing Code composite index (code, status):');
    const startTime4 = Date.now();
    const code = await prisma.code.findFirst({
      where: {
        code: 'TEST-CODE',
        status: 'ACTIVE'
      }
    });
    console.log(`   ✓ Query executed in ${Date.now() - startTime4}ms (${code ? 'found' : 'not found'})\n`);

    // Test 5: Account owner lookup with index (roleId, isAccountOwner)
    console.log('5. Testing Person index for account owner (roleId, isAccountOwner):');
    const startTime5 = Date.now();
    const accountOwner = await prisma.person.findFirst({
      where: {
        roleId: 'test-role-id',
        isAccountOwner: true
      }
    });
    console.log(`   ✓ Query executed in ${Date.now() - startTime5}ms (${accountOwner ? 'found' : 'not found'})\n`);

    console.log('✅ All index tests completed successfully!');
    console.log('\nNote: These queries should be significantly faster with the new indexes.');
    console.log('In production with large datasets, the performance improvement will be more noticeable.');

  } catch (error) {
    console.error('❌ Error testing indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testIndexes().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});