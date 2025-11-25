#!/usr/bin/env npx tsx
/**
 * Script to check kiosk data and fix missing persons issue
 * Run with: npx tsx scripts/check-kiosk-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking kiosk data...\n');

  // Get all active kiosk codes
  const kioskCodes = await prisma.code.findMany({
    where: {
      type: 'KIOSK',
      status: 'ACTIVE',
    },
    include: {
      role: {
        include: {
          user: {
            select: { email: true, name: true }
          },
          persons: {
            where: { status: 'ACTIVE' }
          },
          groups: {
            where: { status: 'ACTIVE' },
            include: {
              members: {
                include: {
                  person: true
                }
              }
            }
          }
        }
      },
      group: true,
      person: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  if (kioskCodes.length === 0) {
    console.log('❌ No active kiosk codes found\n');
    return;
  }

  console.log(`Found ${kioskCodes.length} active kiosk code(s):\n`);

  for (const code of kioskCodes) {
    console.log('═'.repeat(60));
    console.log(`📌 Code: ${code.code}`);
    console.log(`   Role: ${code.role.user.name || code.role.user.email} (${code.role.type})`);
    console.log(`   Type: ${code.personId ? 'Individual' : code.groupId ? 'Group' : 'Role'}`);

    if (code.personId) {
      console.log(`   Individual Person: ${code.person?.name || 'NOT FOUND'}`);
    }

    if (code.groupId) {
      console.log(`   Group: ${code.group?.name || 'NOT FOUND'}`);
    }

    // Show available persons (excluding account owner)
    const availablePersons = code.role.persons.filter(p => !p.isAccountOwner);
    console.log(`\n   Available Persons (${availablePersons.length}):`);
    if (availablePersons.length === 0) {
      console.log('   ⚠️  NO PERSONS AVAILABLE (only "Me" person exists)');
    } else {
      availablePersons.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });
    }

    // Show group members
    if (code.role.groups.length > 0) {
      console.log(`\n   Groups with Members:`);
      code.role.groups.forEach(g => {
        const activeMembers = g.members.filter(m => m.person.status === 'ACTIVE' && !m.person.isAccountOwner);
        console.log(`   - ${g.name} (${g.type}): ${activeMembers.length} active member(s)`);
        activeMembers.forEach(m => {
          console.log(`     • ${m.person.name}`);
        });
      });
    }
    console.log();
  }

  console.log('═'.repeat(60));
  console.log('\n📊 Summary:\n');

  // Get roles with kiosk codes
  const rolesWithKiosk = await prisma.role.findMany({
    where: {
      codes: {
        some: {
          type: 'KIOSK',
          status: 'ACTIVE'
        }
      }
    },
    include: {
      user: { select: { email: true, name: true } },
      persons: { where: { status: 'ACTIVE' } },
      _count: {
        select: {
          persons: { where: { status: 'ACTIVE', isAccountOwner: false } }
        }
      }
    }
  });

  let needsFix = 0;
  rolesWithKiosk.forEach(role => {
    const nonOwnerPersons = role._count.persons;
    console.log(`• ${role.user.name || role.user.email} (${role.type}): ${nonOwnerPersons} non-owner person(s)`);
    if (nonOwnerPersons === 0) {
      console.log(`  ⚠️  NEEDS FIX: No persons available for kiosk`);
      needsFix++;
    }
  });

  if (needsFix > 0) {
    console.log(`\n⚠️  ${needsFix} role(s) need additional persons for kiosk to work properly.`);
    console.log('\n💡 Solution: Add persons (kids/students) to these roles:');
    console.log('   1. Go to the parent/teacher dashboard');
    console.log('   2. Click "Add Person" or "Add Student"');
    console.log('   3. Create profiles for kids/students');
    console.log('   4. Then the kiosk will show these persons for selection');
  } else {
    console.log('\n✅ All roles with kiosk codes have persons available');
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });