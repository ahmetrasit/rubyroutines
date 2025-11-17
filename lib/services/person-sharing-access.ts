import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

/**
 * Check if a user has access to a person
 */
export async function hasAccessToPerson(
  userId: string,
  roleId: string,
  personId: string,
  requiredPermission: 'VIEW' | 'EDIT' | 'MANAGE' = 'VIEW'
): Promise<boolean> {
  // Check if user owns the person
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      roleId,
      role: {
        userId,
      },
    },
  });

  if (person) return true; // Owner has full access

  // Check sharing connections
  const connection = await prisma.personSharingConnection.findFirst({
    where: {
      ownerPersonId: personId,
      sharedWithRole: {
        userId,
      },
      status: 'ACTIVE',
    },
  });

  if (!connection) return false;

  // Check permission level
  const permissionHierarchy = { VIEW: 1, EDIT: 2, MANAGE: 3 };
  const hasPermission =
    permissionHierarchy[connection.permissions] >=
    permissionHierarchy[requiredPermission];

  return hasPermission;
}

/**
 * Get all accessible persons for a user (owned + shared)
 */
export async function getAccessiblePersons(roleId: string, userId: string) {
  // Get owned persons
  const ownedPersons = await prisma.person.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
    },
    include: {
      assignments: {
        include: {
          routine: {
            include: {
              tasks: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
      },
    },
  });

  // Get shared persons
  const sharedConnections = await prisma.personSharingConnection.findMany({
    where: {
      sharedWithRoleId: roleId,
      status: 'ACTIVE',
      shareType: 'PERSON',
    },
    include: {
      ownerPerson: {
        include: {
          assignments: {
            include: {
              routine: {
                include: {
                  tasks: {
                    where: { status: 'ACTIVE' },
                  },
                },
              },
            },
          },
        },
      },
      ownerRole: {
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  const sharedPersons = sharedConnections
    .filter((conn) => conn.ownerPerson !== null)
    .map((conn) => ({
      ...conn.ownerPerson!,
      isShared: true,
      sharedBy: conn.ownerRole.user.name,
      sharedByImage: conn.ownerRole.user.image,
      permissions: conn.permissions,
      shareType: conn.shareType,
      contextData: conn.contextData,
    }));

  return {
    ownedPersons: ownedPersons.map((p) => ({ ...p, isShared: false })),
    sharedPersons,
    allPersons: [
      ...ownedPersons.map((p) => ({ ...p, isShared: false })),
      ...sharedPersons,
    ],
  };
}

/**
 * Filter task completions based on sharing permissions
 */
export async function getTaskCompletionsForPerson(
  personId: string,
  requestingUserId: string,
  requestingRoleId: string
) {
  // Check access
  const hasAccess = await hasAccessToPerson(
    requestingUserId,
    requestingRoleId,
    personId,
    'VIEW'
  );

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this person',
    });
  }

  // Get task completions
  return await prisma.taskCompletion.findMany({
    where: {
      personId,
    },
    include: {
      task: {
        include: {
          routine: true,
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 100, // Last 100 completions
  });
}
