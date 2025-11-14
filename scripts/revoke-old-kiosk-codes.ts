import { prisma } from '../lib/prisma';

async function revokeOldKioskCodes() {
  console.log('Revoking all existing kiosk codes...');
  
  const result = await prisma.code.updateMany({
    where: {
      type: 'KIOSK',
      status: 'ACTIVE'
    },
    data: {
      status: 'REVOKED'
    }
  });

  console.log(`✓ Revoked ${result.count} kiosk codes`);
  console.log('New codes with the updated format will be auto-generated when users access their dashboards.');
}

revokeOldKioskCodes()
  .catch((error) => {
    console.error('Error revoking kiosk codes:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
