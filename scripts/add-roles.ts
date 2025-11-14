import { prisma } from '../lib/prisma';

async function addRoles() {
  try {
    // Get all users without both roles
    const users = await prisma.user.findMany({
      include: { roles: true },
    });

    for (const user of users) {
      const hasParentRole = user.roles.some((role) => role.type === 'PARENT');
      const hasTeacherRole = user.roles.some((role) => role.type === 'TEACHER');

      let parentRole = user.roles.find((role) => role.type === 'PARENT');

      // Create missing PARENT role
      if (!hasParentRole) {
        console.log(`Creating PARENT role for user ${user.email}`);
        parentRole = await prisma.role.create({
          data: {
            userId: user.id,
            type: 'PARENT',
            tier: 'FREE',
            color: '#9333ea',
          },
        });
      }

      // Create missing TEACHER role
      if (!hasTeacherRole) {
        console.log(`Creating TEACHER role for user ${user.email}`);
        await prisma.role.create({
          data: {
            userId: user.id,
            type: 'TEACHER',
            tier: 'FREE',
            color: '#3b82f6',
          },
        });
      }

      // Ensure "Me" person exists for parent role
      if (parentRole) {
        const mePersonExists = await prisma.person.findFirst({
          where: {
            roleId: parentRole.id,
            name: 'Me',
          },
        });

        if (!mePersonExists) {
          console.log(`Creating "Me" person for user ${user.email}`);
          await prisma.person.create({
            data: {
              roleId: parentRole.id,
              name: 'Me',
              avatar: JSON.stringify({
                color: '#BAE1FF',
                emoji: '👤',
              }),
              status: 'ACTIVE',
            },
          });
        }
      }

      console.log(`✓ User ${user.email} now has both roles`);
    }

    console.log('\n✅ All users updated successfully!');
  } catch (error) {
    console.error('Error adding roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRoles();
