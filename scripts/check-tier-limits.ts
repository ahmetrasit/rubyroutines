import { prisma } from '../lib/prisma';
import { getEffectiveTierLimits } from '../lib/services/admin/system-settings.service';
import { mapDatabaseLimitsToComponentFormat } from '../lib/services/tier-limits';

async function main() {
  try {
    // Check if tier_limits setting exists
    const tierLimitsSetting = await prisma.systemSettings.findUnique({
      where: { key: 'tier_limits' }
    });

    console.log('\n=== TIER LIMITS FROM DATABASE ===');
    if (tierLimitsSetting) {
      console.log('Found tier_limits in SystemSettings:');
      console.log(JSON.stringify(tierLimitsSetting.value, null, 2));

      // Show FREE tier parent mode limits
      const freeTier = (tierLimitsSetting.value as any)?.FREE;
      if (freeTier) {
        console.log('\n=== FREE TIER PARENT MODE LIMITS ===');
        console.log(JSON.stringify(freeTier.parent, null, 2));
      }
    } else {
      console.log('❌ No tier_limits found in SystemSettings table');
      console.log('The system will use default values from system-settings.service.ts');
    }

    // Check a sample role
    const sampleRole = await prisma.role.findFirst({
      where: { type: 'PARENT' },
      include: {
        user: { select: { email: true } }
      }
    });

    if (sampleRole) {
      console.log('\n=== SAMPLE PARENT ROLE ===');
      console.log('User:', sampleRole.user.email);
      console.log('Tier:', sampleRole.tier);
      console.log('TierOverride:', sampleRole.tierOverride ? JSON.stringify(sampleRole.tierOverride, null, 2) : 'null');

      console.log('\n=== EFFECTIVE LIMITS FOR THIS ROLE ===');
      const effectiveLimits = await getEffectiveTierLimits(sampleRole.id);
      console.log('Raw effective limits from DB:');
      console.log(JSON.stringify(effectiveLimits, null, 2));

      const componentLimits = mapDatabaseLimitsToComponentFormat(effectiveLimits as any, sampleRole.type);
      console.log('\nMapped to component format:');
      console.log(JSON.stringify(componentLimits, null, 2));
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
