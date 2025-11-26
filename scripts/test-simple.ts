import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function test() {
  try {
    console.log('Attempting to query routine with isProtected field...\n');

    const routine = await prisma.routine.findFirst({
      select: {
        id: true,
        name: true,
        isProtected: true
      }
    });

    console.log('Success! Routine:', routine);
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.code === 'P2022') {
      console.log('\n🔍 This means Prisma client is out of sync with the database.');
      console.log('The column exists in the database but Prisma is trying to use the wrong name.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
