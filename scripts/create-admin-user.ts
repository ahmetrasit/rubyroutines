/**
 * Script to create an admin user
 * Usage: npx tsx scripts/create-admin-user.ts <email>
 */

import { prisma } from '../lib/prisma';

async function createAdminUser(email: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      console.log('Please register a user account first, then run this script');
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`User ${email} is already an admin`);
      process.exit(0);
    }

    // Grant admin access
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });

    console.log(`✅ Successfully granted admin access to ${email}`);
    console.log(`User ID: ${user.id}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/create-admin-user.ts <email>');
  process.exit(1);
}

createAdminUser(email);
