/**
 * Script to create test users in Supabase Auth
 * Run with: npx tsx scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { RoleType, Tier } from '../lib/types/prisma-enums';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    id: 'test-parent-user-id',
    email: 'parent@test.com',
    password: 'parent123',
    name: 'Test Parent',
    roleType: RoleType.PARENT,
    tier: Tier.FREE,
  },
  {
    id: 'test-teacher-user-id',
    email: 'teacher@test.com',
    password: 'teacher123',
    name: 'Test Teacher',
    roleType: RoleType.TEACHER,
    tier: Tier.BRONZE,
  },
  {
    id: 'test-principal-user-id',
    email: 'principal@test.com',
    password: 'principal123',
    name: 'Test Principal',
    roleType: RoleType.PRINCIPAL,
    tier: Tier.PRO,
  },
];

async function createTestUsers() {
  console.log('Creating test users in Supabase Auth...\n');

  for (const testUser of TEST_USERS) {
    try {
      // Create user in Supabase Auth using Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          name: testUser.name,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`✓ User already exists: ${testUser.email}`);
          // Update existing user in database
          await prisma.user.upsert({
            where: { email: testUser.email },
            update: {
              name: testUser.name,
              emailVerified: new Date(),
            },
            create: {
              id: (authData as any)?.user?.id || (testUser as any).id,
              email: testUser.email,
              name: testUser.name,
              emailVerified: new Date(),
            },
          });
        } else {
          throw authError;
        }
      } else if (authData.user) {
        console.log(`✓ Created Supabase auth user: ${testUser.email}`);

        // Create/update user in database
        await prisma.user.upsert({
          where: { email: testUser.email },
          update: {
            name: testUser.name,
            emailVerified: new Date(),
          },
          create: {
            id: authData.user.id,
            email: testUser.email,
            name: testUser.name,
            emailVerified: new Date(),
          },
        });

        console.log(`✓ Created database user: ${testUser.email}`);

        // Create role
        await prisma.role.upsert({
          where: {
            userId_type: {
              userId: authData.user.id,
              type: testUser.roleType,
            },
          },
          update: {},
          create: {
            userId: authData.user.id,
            type: testUser.roleType,
            tier: testUser.tier,
          },
        });

        console.log(`✓ Created ${testUser.roleType} role for: ${testUser.email}\n`);
      }
    } catch (error: any) {
      console.error(`✗ Error creating user ${testUser.email}:`, error.message);
      console.error('Full error:', error);
    }
  }

  console.log('\n=================================');
  console.log('Test Users Created Successfully!');
  console.log('=================================\n');
  console.log('Login credentials:\n');
  TEST_USERS.forEach((user) => {
    console.log(`${user.roleType}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}\n`);
  });
}

createTestUsers()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
