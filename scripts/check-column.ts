import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkColumn() {
  try {
    // Check if column exists using raw SQL
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routines'
        AND column_name = 'is_protected'
    `;

    console.log('Column check result:', result);

    if (result.length > 0) {
      console.log('✓ is_protected column EXISTS in database');

      // Try to query it with raw SQL
      const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM routines
        WHERE is_protected = true
      `;
      console.log(`✓ Found ${count[0].count} protected routines`);
    } else {
      console.log('✗ is_protected column DOES NOT EXIST in database');
      console.log('\n🔧 The migration needs to be applied. Run:');
      console.log('   npx prisma db execute --file prisma/migrations/20251125140000_add_is_protected_to_routines/migration.sql');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumn();
