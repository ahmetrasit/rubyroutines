import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const result = await prisma.$queryRaw<Array<{ column_name: string, data_type: string }>>`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'routines'
      ORDER BY column_name
    `;

    console.log('All columns in routines table:');
    console.log('='.repeat(60));
    result.forEach(col => {
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type}`);
    });
    console.log('='.repeat(60));

    // Check specific columns
    const teacherOnly = result.find(c => c.column_name.includes('teacher'));
    const protected = result.find(c => c.column_name.includes('protected'));

    console.log('\n🔍 Checking naming convention:');
    console.log(`  Teacher-only field: ${teacherOnly?.column_name || 'NOT FOUND'}`);
    console.log(`  Protected field:    ${protected?.column_name || 'NOT FOUND'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
