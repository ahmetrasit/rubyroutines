/**
 * Migration script to rename tier values
 * Run with: node migrate-tiers.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateTiers() {
  console.log('🔄 Running tier migration...');
  console.log('This will rename:');
  console.log('  BASIC → BRONZE');
  console.log('  PREMIUM → GOLD');
  console.log('  SCHOOL → PRO');
  console.log('');

  try {
    // Execute the migration SQL directly
    await prisma.$executeRawUnsafe(`ALTER TYPE "Tier" ADD VALUE IF NOT EXISTS 'BRONZE'`);
    console.log('✓ Added BRONZE tier');
    
    await prisma.$executeRawUnsafe(`ALTER TYPE "Tier" ADD VALUE IF NOT EXISTS 'GOLD'`);
    console.log('✓ Added GOLD tier');
    
    await prisma.$executeRawUnsafe(`ALTER TYPE "Tier" ADD VALUE IF NOT EXISTS 'PRO'`);
    console.log('✓ Added PRO tier');
    
    console.log('');
    console.log('📝 Updating existing records...');
    
    const basicCount = await prisma.$executeRaw`UPDATE "roles" SET "tier" = 'BRONZE'::"Tier" WHERE "tier" = 'BASIC'::"Tier"`;
    console.log(`✓ Updated ${basicCount} roles from BASIC to BRONZE`);
    
    const premiumCount = await prisma.$executeRaw`UPDATE "roles" SET "tier" = 'GOLD'::"Tier" WHERE "tier" = 'PREMIUM'::"Tier"`;
    console.log(`✓ Updated ${premiumCount} roles from PREMIUM to GOLD`);
    
    const schoolCount = await prisma.$executeRaw`UPDATE "roles" SET "tier" = 'PRO'::"Tier" WHERE "tier" = 'SCHOOL'::"Tier"`;
    console.log(`✓ Updated ${schoolCount} roles from SCHOOL to PRO`);
    
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    
    // Show current tier distribution
    const distribution = await prisma.$queryRaw`
      SELECT tier, COUNT(*) as count 
      FROM roles 
      GROUP BY tier 
      ORDER BY tier
    `;
    
    console.log('📊 Current tier distribution:');
    console.table(distribution);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateTiers()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
