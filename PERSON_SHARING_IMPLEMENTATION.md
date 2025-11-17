# Person Sharing Implementation Plan
## Extending kidtrek's Student Sharing Pattern to rubyroutines

### Executive Summary

This document outlines the implementation of a flexible person-to-person sharing system in rubyroutines, inspired by kidtrek's student-parent connection pattern. The system will support:

1. **Co-parent sharing**: Parent shares kids with co-parent
2. **Co-teacher sharing**: Teacher shares students with co-teacher
3. **Cross-role sharing**: Parent shares their own routines/progress with teacher
4. **Flexible permissions**: View-only, edit, or manage access

---

## Current State Analysis

### Existing Infrastructure in rubyroutines

```prisma
// ✅ Already exists - limited to teacher-student-parent only
model ConnectionCode {
  id              String      @id @default(cuid())
  code            String      @unique
  teacherRoleId   String
  studentPersonId String
  expiresAt       DateTime
  usedAt          DateTime?
  status          CodeStatus  @default(ACTIVE)
}

// ✅ Already exists - tracks teacher-student-parent connections
model StudentParentConnection {
  id              String   @id @default(cuid())
  teacherRoleId   String
  studentPersonId String
  parentRoleId    String
  parentPersonId  String
  permissions     String   @default("TASK_COMPLETION")
  status          String   @default("ACTIVE")
}

// ✅ Already exists - role-level sharing for parents
model CoParent {
  id                String   @id @default(cuid())
  primaryRoleId     String
  coParentRoleId    String
  permissions       String   @default("VIEW")
  status            String   @default("ACTIVE")
}

// ✅ Already exists - classroom-level sharing for teachers
model CoTeacher {
  id                    String   @id @default(cuid())
  groupId               String   // Classroom
  primaryTeacherRoleId  String
  coTeacherRoleId       String
  permissions           String   @default("VIEW")
  status                String   @default("ACTIVE")
}
```

### Gaps Identified

1. **No person-to-person sharing** - Current models are role-centric or limited to specific scenarios
2. **No cross-role support** - Cannot share parent routines with teacher
3. **Limited flexibility** - Cannot share individual persons between users
4. **Teacher-only codes** - ConnectionCode limited to teacher→parent flow

---

## Proposed Solution

### Database Schema Changes

#### 1. New `PersonSharingInvite` Table (Replaces/Extends ConnectionCode)

```prisma
model PersonSharingInvite {
  id                String      @id @default(cuid())
  inviteCode        String      @unique              // 3-word code (e.g., "happy-turtle-jump")

  // Who is sharing
  ownerRoleId       String                           // Role that owns the person
  ownerPersonId     String?                          // Optional: specific person being shared

  // What is being shared
  shareType         ShareType                        // PERSON, ROUTINE_ACCESS, FULL_ROLE
  permissions       PermissionLevel @default(VIEW)   // VIEW, EDIT, MANAGE

  // Context for what's being shared
  contextData       Json?                            // Flexible data (e.g., specific routine IDs)

  // Invite metadata
  expiresAt         DateTime                         // 90 days from creation
  maxUses           Int?                             // null = unlimited, 1 = single use
  useCount          Int         @default(0)
  status            CodeStatus  @default(ACTIVE)     // ACTIVE, CLAIMED, EXPIRED, REVOKED

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  ownerRole         Role        @relation("OwnerRoleSharingInvites", fields: [ownerRoleId], references: [id], onDelete: Cascade)
  ownerPerson       Person?     @relation("OwnerPersonSharingInvites", fields: [ownerPersonId], references: [id], onDelete: Cascade)
  claimedConnections PersonSharingConnection[] @relation("ClaimedFromInvite")

  @@index([inviteCode])
  @@index([ownerRoleId])
  @@index([ownerPersonId])
  @@index([status])
  @@index([expiresAt])
  @@map("person_sharing_invites")
}

enum ShareType {
  PERSON              // Share a specific person (kid, student, etc.)
  ROUTINE_ACCESS      // Share routine viewing/editing for a person
  FULL_ROLE           // Share entire role access (co-parent/co-teacher)
}

enum PermissionLevel {
  VIEW                // View task completions only
  EDIT                // View + complete tasks
  MANAGE              // View + Edit + manage routines/settings
}
```

#### 2. New `PersonSharingConnection` Table (Unified Connection Tracking)

```prisma
model PersonSharingConnection {
  id                String          @id @default(cuid())

  // Who is sharing
  ownerRoleId       String
  ownerPersonId     String?                          // null for role-level sharing

  // Who it's shared with
  sharedWithRoleId  String
  sharedWithUserId  String

  // What is being shared
  shareType         ShareType
  permissions       PermissionLevel @default(VIEW)

  // Metadata
  contextData       Json?                            // Flexible: classroom ID, routine IDs, etc.
  inviteCodeId      String?                          // Track which invite created this
  status            String          @default("ACTIVE") // ACTIVE, REVOKED, EXPIRED

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  // Relations
  ownerRole         Role            @relation("OwnerRoleSharingConnections", fields: [ownerRoleId], references: [id], onDelete: Cascade)
  ownerPerson       Person?         @relation("OwnerPersonSharingConnections", fields: [ownerPersonId], references: [id], onDelete: Cascade)
  sharedWithRole    Role            @relation("SharedWithRoleSharingConnections", fields: [sharedWithRoleId], references: [id], onDelete: Cascade)
  sharedWithUser    User            @relation("SharedWithUserSharingConnections", fields: [sharedWithUserId], references: [id], onDelete: Cascade)
  claimedFromInvite PersonSharingInvite? @relation("ClaimedFromInvite", fields: [inviteCodeId], references: [id], onDelete: SetNull)

  @@unique([ownerRoleId, ownerPersonId, sharedWithRoleId, shareType]) // Prevent duplicate shares
  @@index([ownerRoleId])
  @@index([ownerPersonId])
  @@index([sharedWithRoleId])
  @@index([sharedWithUserId])
  @@index([status])
  @@map("person_sharing_connections")
}
```

#### 3. Migration Strategy

**Existing Data Compatibility:**
- Keep `StudentParentConnection` for now (backward compatibility)
- Gradually migrate to unified `PersonSharingConnection` model
- Add migration script to convert existing connections

```typescript
// Migration pseudo-code
async function migrateExistingConnections() {
  // 1. Migrate StudentParentConnection → PersonSharingConnection
  const studentParentConnections = await prisma.studentParentConnection.findMany();

  for (const conn of studentParentConnections) {
    await prisma.personSharingConnection.create({
      data: {
        ownerRoleId: conn.teacherRoleId,
        ownerPersonId: conn.studentPersonId,
        sharedWithRoleId: conn.parentRoleId,
        sharedWithUserId: conn.parentRole.userId,
        shareType: 'PERSON',
        permissions: conn.permissions === 'TASK_COMPLETION' ? 'VIEW' : 'EDIT',
        contextData: {
          legacyType: 'teacher-student-parent',
          teacherRoleId: conn.teacherRoleId
        },
        status: conn.status,
        createdAt: conn.createdAt,
      }
    });
  }

  // 2. Mark old ConnectionCode entries
  // Keep for reference but mark as MIGRATED
}
```

---

## Implementation Scenarios

### Scenario 1: Co-Parent Sharing (Parent → Parent)

**Use Case:** Sarah wants to share her kids with her partner Alex (co-parent).

**Flow:**

1. **Generate Invite Code** (Parent Dashboard)
   ```typescript
   // Sarah selects kids to share
   const inviteCode = await generatePersonSharingInvite({
     ownerRoleId: sarahParentRoleId,
     ownerPersonId: null,  // null = all persons in role
     shareType: 'FULL_ROLE',
     permissions: 'MANAGE',  // Co-parent gets full access
     expiresAt: add90Days(),
     maxUses: 1,  // Single use for co-parent
   });
   // Returns: "happy-turtle-jump"
   ```

2. **Share Code** (External)
   - Sarah shares code with Alex via text/email

3. **Claim Invite** (Alex's Parent Dashboard)
   ```typescript
   // Alex enters code
   const validation = await validatePersonSharingInvite('happy-turtle-jump');

   // Shows preview:
   // "Sarah Smith wants to share 3 kids with you (Emma, Liam, Sophia)"
   // Permission level: Manage (Full Access)

   // Alex confirms
   await claimPersonSharingInvite({
     inviteCode: 'happy-turtle-jump',
     claimingRoleId: alexParentRoleId,
     claimingUserId: alexUserId,
   });
   ```

4. **Result**
   - PersonSharingConnection created
   - Alex can now see Sarah's kids in his parent dashboard
   - Alex has full access to manage routines, complete tasks, view progress
   - Sarah's kids appear in Alex's person list with "Shared by Sarah" badge

**UI Changes:**
- Parent Dashboard: "Share with Co-Parent" button
- Modal showing kid selection (all or specific)
- Permission level selector (View/Edit/Manage)
- Generated code display with copy button
- "Accept Share" flow in parent onboarding

---

### Scenario 2: Co-Teacher Sharing (Teacher → Teacher)

**Use Case:** Ms. Johnson wants to share her classroom with substitute teacher Mr. Brown.

**Flow:**

1. **Generate Invite Code** (Teacher Dashboard → Classroom Settings)
   ```typescript
   const inviteCode = await generatePersonSharingInvite({
     ownerRoleId: msJohnsonRoleId,
     ownerPersonId: null,  // Share entire classroom
     shareType: 'FULL_ROLE',
     permissions: 'EDIT',  // Substitute can complete tasks but not modify routines
     contextData: {
       classroomId: '1st-grade-classroom',
       classroomName: '1st Grade - Ms. Johnson'
     },
     expiresAt: add90Days(),
     maxUses: 1,
   });
   ```

2. **Claim Invite** (Mr. Brown's Teacher Dashboard)
   ```typescript
   // Preview shows:
   // "Ms. Johnson wants to share classroom '1st Grade - Ms. Johnson' with you"
   // "25 students - Permission: Edit (complete tasks)"

   await claimPersonSharingInvite({
     inviteCode: inviteCode,
     claimingRoleId: mrBrownRoleId,
     claimingUserId: mrBrownUserId,
   });
   ```

3. **Result**
   - Mr. Brown sees "1st Grade - Ms. Johnson (Shared)" in his teacher dashboard
   - Can view all students and their routines
   - Can complete tasks for students
   - Cannot modify/delete routines (EDIT permission, not MANAGE)
   - Separate visual indicator for shared classrooms

**UI Changes:**
- Classroom settings: "Share Classroom" button
- Permission selector: View/Edit/Manage
- Duration selector: 7 days, 30 days, 90 days
- Shared classroom visual distinction (border color, badge)

---

### Scenario 3: Parent → Teacher Sharing (Cross-Role)

**Use Case:** Parent wants teacher to monitor their kid's home routines.

**Flow:**

1. **Generate Invite Code** (Parent Dashboard → Kid Settings)
   ```typescript
   const inviteCode = await generatePersonSharingInvite({
     ownerRoleId: parentRoleId,
     ownerPersonId: kidId,
     shareType: 'ROUTINE_ACCESS',
     permissions: 'VIEW',  // Teacher can only view, not modify
     contextData: {
       routineIds: ['morning-routine', 'bedtime-routine'],  // Specific routines
       personName: 'Emma',
     },
     expiresAt: add90Days(),
     maxUses: 1,
   });
   ```

2. **Claim Invite** (Teacher Dashboard)
   ```typescript
   // Preview shows:
   // "Sarah Smith wants to share Emma's home routines with you"
   // "2 routines: Morning Routine, Bedtime Routine - Permission: View Only"

   await claimPersonSharingInvite({
     inviteCode: inviteCode,
     claimingRoleId: teacherRoleId,
     claimingUserId: teacherUserId,
   });
   ```

3. **Result**
   - Teacher sees "Emma (Sarah's Daughter)" in a special "Home Connections" section
   - Can view completion history for shared routines
   - Read-only access with clear visual indicators
   - Appears in analytics/reports if teacher wants to track overall progress

**UI Changes:**
- Parent kid settings: "Share with Teacher" button
- Routine selector modal (which routines to share)
- Teacher dashboard: New "Home Connections" section
- Distinct visual styling for cross-role shares (different color scheme)

---

### Scenario 4: Teacher → Parent Sharing (Original kidtrek Pattern)

**Use Case:** Teacher shares student's classroom progress with parent.

**Flow:**

1. **Generate Invite Code** (Teacher Classroom → Student Card)
   ```typescript
   const inviteCode = await generatePersonSharingInvite({
     ownerRoleId: teacherRoleId,
     ownerPersonId: studentId,
     shareType: 'PERSON',
     permissions: 'VIEW',  // Parent can only view, not edit classroom routines
     contextData: {
       classroomId: classroomId,
       studentName: 'Liam',
     },
     expiresAt: add90Days(),
     maxUses: null,  // Multiple parents can use same code (both parents)
   });
   ```

2. **Claim Invite** (Parent Dashboard)
   ```typescript
   // Multi-step flow like kidtrek:
   // Step 1: Enter code
   // Step 2: Select which kid to link (or create new kid)
   // Step 3: Confirmation

   await claimPersonSharingInvite({
     inviteCode: inviteCode,
     claimingRoleId: parentRoleId,
     claimingUserId: parentUserId,
     contextData: {
       linkedKidId: parentKidId,  // Links classroom student to parent's kid
     }
   });
   ```

3. **Result**
   - Parent sees kid card with "School Connection" badge
   - Kid tasks page shows separate "School Tasks" section (blue theme)
   - Real-time sync of classroom tasks and completions
   - Read-only view with teacher's name displayed

**UI Changes:**
- Exact same as kidtrek implementation
- Teacher: "Share with Parent" button on student card
- Parent: Multi-step claim flow
- Parent kid page: Separate school section with blue theme

---

## Backend Services Architecture

### 1. Code Generation Service

**File:** `/lib/services/person-sharing-code.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { getRandomSafeWords } from './safe-words';
import { TRPCError } from '@trpc/server';

interface GenerateInviteParams {
  ownerRoleId: string;
  ownerPersonId?: string;
  shareType: 'PERSON' | 'ROUTINE_ACCESS' | 'FULL_ROLE';
  permissions: 'VIEW' | 'EDIT' | 'MANAGE';
  contextData?: any;
  expiresInDays?: number;
  maxUses?: number;
}

/**
 * Generate unique person sharing invite code
 * Format: word1-word2-word3 (lowercase, 3 words)
 * Checks uniqueness across ALL code systems
 */
export async function generatePersonSharingInvite(params: GenerateInviteParams): Promise<string> {
  const {
    ownerRoleId,
    ownerPersonId,
    shareType,
    permissions,
    contextData,
    expiresInDays = 90,
    maxUses,
  } = params;

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Generate 3-word code
    const words = getRandomSafeWords(3);
    const code = words.join('-').toLowerCase();

    // Check uniqueness across all code systems
    const isUnique = await isCodeUnique(code);

    if (isUnique) {
      // Calculate expiration date
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      // Create invite
      await prisma.personSharingInvite.create({
        data: {
          inviteCode: code,
          ownerRoleId,
          ownerPersonId,
          shareType,
          permissions,
          contextData,
          expiresAt,
          maxUses,
          status: 'ACTIVE',
        },
      });

      return code;
    }
    attempts++;
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to generate unique invite code after 50 attempts',
  });
}

/**
 * Check if code is unique across all code systems
 */
async function isCodeUnique(code: string): Promise<boolean> {
  // Check person sharing invites
  const sharingInvite = await prisma.personSharingInvite.findUnique({
    where: { inviteCode: code },
  });
  if (sharingInvite) return false;

  // Check marketplace share codes
  const marketplaceCode = await prisma.marketplaceShareCode.findUnique({
    where: { shareCode: code },
  });
  if (marketplaceCode) return false;

  // Check kiosk codes (normalized)
  const normalizedKioskCode = code.toUpperCase();
  const kioskCode = await prisma.code.findFirst({
    where: {
      code: normalizedKioskCode,
      OR: [
        { expiresAt: { gt: new Date() } },
        { status: 'ACTIVE' },
      ],
    },
  });
  if (kioskCode) return false;

  // Check legacy connection codes
  const connectionCode = await prisma.connectionCode.findFirst({
    where: {
      code: code,
      status: 'ACTIVE',
    },
  });
  if (connectionCode) return false;

  return true;
}

/**
 * Validate person sharing invite code
 */
export async function validatePersonSharingInvite(code: string) {
  const normalizedCode = code.toLowerCase().trim();

  const invite = await prisma.personSharingInvite.findUnique({
    where: { inviteCode: normalizedCode },
    include: {
      ownerRole: {
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
      ownerPerson: {
        select: { name: true, avatar: true },
      },
    },
  });

  if (!invite) {
    return { valid: false, error: 'Invalid invite code' };
  }

  // Check status
  if (invite.status !== 'ACTIVE') {
    return { valid: false, error: 'Invite code has been revoked or expired' };
  }

  // Check expiration
  if (invite.expiresAt < new Date()) {
    await prisma.personSharingInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    });
    return { valid: false, error: 'Invite code has expired' };
  }

  // Check usage limit
  if (invite.maxUses && invite.useCount >= invite.maxUses) {
    return { valid: false, error: 'Invite code has reached maximum uses' };
  }

  return {
    valid: true,
    invite: {
      id: invite.id,
      ownerRole: invite.ownerRole,
      ownerPerson: invite.ownerPerson,
      shareType: invite.shareType,
      permissions: invite.permissions,
      contextData: invite.contextData,
      expiresAt: invite.expiresAt,
    },
  };
}

/**
 * Claim person sharing invite
 */
interface ClaimInviteParams {
  inviteCode: string;
  claimingRoleId: string;
  claimingUserId: string;
  contextData?: any;
}

export async function claimPersonSharingInvite(params: ClaimInviteParams) {
  const { inviteCode, claimingRoleId, claimingUserId, contextData } = params;

  // Validate invite
  const validation = await validatePersonSharingInvite(inviteCode);
  if (!validation.valid || !validation.invite) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: validation.error || 'Invalid invite code',
    });
  }

  const invite = validation.invite;

  // Check if already claimed by this user
  const existingConnection = await prisma.personSharingConnection.findFirst({
    where: {
      ownerRoleId: invite.ownerRole.id,
      ownerPersonId: invite.ownerPerson?.id || null,
      sharedWithRoleId: claimingRoleId,
      shareType: invite.shareType,
      status: 'ACTIVE',
    },
  });

  if (existingConnection) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'You have already claimed this invite',
    });
  }

  // Create connection
  const connection = await prisma.personSharingConnection.create({
    data: {
      ownerRoleId: invite.ownerRole.id,
      ownerPersonId: invite.ownerPerson?.id || null,
      sharedWithRoleId: claimingRoleId,
      sharedWithUserId: claimingUserId,
      shareType: invite.shareType,
      permissions: invite.permissions,
      contextData: {
        ...invite.contextData,
        ...contextData,
      },
      inviteCodeId: invite.id,
      status: 'ACTIVE',
    },
  });

  // Increment use count
  await prisma.personSharingInvite.update({
    where: { id: invite.id },
    data: {
      useCount: { increment: 1 },
      status:
        invite.maxUses && invite.useCount + 1 >= invite.maxUses
          ? 'CLAIMED'
          : 'ACTIVE',
    },
  });

  return connection;
}

/**
 * Revoke person sharing connection
 */
export async function revokePersonSharingConnection(
  connectionId: string,
  requestingUserId: string
) {
  const connection = await prisma.personSharingConnection.findUnique({
    where: { id: connectionId },
    include: {
      ownerRole: true,
    },
  });

  if (!connection) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Connection not found',
    });
  }

  // Only owner can revoke
  if (connection.ownerRole.userId !== requestingUserId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the owner can revoke this connection',
    });
  }

  await prisma.personSharingConnection.update({
    where: { id: connectionId },
    data: { status: 'REVOKED' },
  });

  return { success: true };
}

/**
 * Get all connections for a user
 */
export async function getPersonSharingConnections(
  roleId: string,
  type: 'owned' | 'shared_with_me'
) {
  if (type === 'owned') {
    // Get connections where this role is the owner
    return await prisma.personSharingConnection.findMany({
      where: {
        ownerRoleId: roleId,
        status: 'ACTIVE',
      },
      include: {
        ownerPerson: true,
        sharedWithRole: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // Get connections where this role is the recipient
    return await prisma.personSharingConnection.findMany({
      where: {
        sharedWithRoleId: roleId,
        status: 'ACTIVE',
      },
      include: {
        ownerRole: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
        ownerPerson: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

---

### 2. Data Access Service

**File:** `/lib/services/person-sharing-access.ts`

```typescript
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
```

---

## Frontend Components

### 1. SharePersonModal Component

**File:** `/components/sharing/SharePersonModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { X, Copy, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface SharePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  persons: Array<{ id: string; name: string; avatar?: string }>;
}

export function SharePersonModal({
  isOpen,
  onClose,
  roleId,
  roleType,
  persons,
}: SharePersonModalProps) {
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [shareType, setShareType] = useState<'PERSON' | 'FULL_ROLE'>('PERSON');
  const [permissions, setPermissions] = useState<'VIEW' | 'EDIT' | 'MANAGE'>('VIEW');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const generateCodeMutation = trpc.personSharing.generateInvite.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast({
        title: 'Success',
        description: 'Share code generated successfully',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (shareType === 'PERSON' && selectedPersons.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one person to share',
        variant: 'destructive',
      });
      return;
    }

    generateCodeMutation.mutate({
      ownerRoleId: roleId,
      ownerPersonId: shareType === 'PERSON' ? selectedPersons[0] : undefined,
      shareType,
      permissions,
      expiresInDays: 90,
      maxUses: shareType === 'FULL_ROLE' ? 1 : undefined,
    });
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({
        title: 'Copied!',
        description: 'Share code copied to clipboard',
        variant: 'success',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {generatedCode ? 'Share Code Generated' : `Share ${roleType === 'PARENT' ? 'Kids' : 'Students'}`}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {!generatedCode ? (
              <>
                {/* Share Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What do you want to share?
                  </label>
                  <Select
                    value={shareType}
                    onChange={(e) => setShareType(e.target.value as any)}
                  >
                    <option value="PERSON">
                      Specific {roleType === 'PARENT' ? 'Kids' : 'Students'}
                    </option>
                    <option value="FULL_ROLE">
                      Everything (Co-{roleType === 'PARENT' ? 'Parent' : 'Teacher'})
                    </option>
                  </Select>
                </div>

                {/* Person Selection */}
                {shareType === 'PERSON' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select {roleType === 'PARENT' ? 'Kids' : 'Students'}
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {persons.map((person) => (
                        <label
                          key={person.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedPersons.includes(person.id)}
                            onChange={() => {
                              setSelectedPersons((prev) =>
                                prev.includes(person.id)
                                  ? prev.filter((id) => id !== person.id)
                                  : [...prev, person.id]
                              );
                            }}
                          />
                          <div className="flex items-center gap-2">
                            {person.avatar && (
                              <img
                                src={person.avatar}
                                alt={person.name}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <span className="font-medium">{person.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permission Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permission Level
                  </label>
                  <Select
                    value={permissions}
                    onChange={(e) => setPermissions(e.target.value as any)}
                  >
                    <option value="VIEW">View Only (See progress)</option>
                    <option value="EDIT">Edit (Complete tasks)</option>
                    <option value="MANAGE">Manage (Full access)</option>
                  </Select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    How it works
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>A unique share code will be generated</li>
                    <li>Share the code with the other {roleType.toLowerCase()}</li>
                    <li>They enter the code in their dashboard to connect</li>
                    <li>Code expires in 90 days if not used</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={onClose} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generateCodeMutation.isPending}
                    className="flex-1"
                  >
                    {generateCodeMutation.isPending
                      ? 'Generating...'
                      : 'Generate Share Code'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Success State with Code */}
                <div className="py-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-6">
                    Share this code with the other {roleType.toLowerCase()}
                  </p>

                  <div className="flex items-center gap-2 max-w-md mx-auto">
                    <code className="flex-1 p-3 bg-white border-2 border-green-300 rounded-lg text-xl font-mono text-green-700">
                      {generatedCode}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopy}
                      className="px-4"
                    >
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    Code expires in 90 days
                  </p>
                </div>

                {/* Done Button */}
                <div className="flex justify-center pt-4 border-t">
                  <Button onClick={onClose} className="px-8">
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
```

---

### 2. ClaimShareCodeModal Component

**File:** `/components/sharing/ClaimShareCodeModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface ClaimShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  userId: string;
}

export function ClaimShareCodeModal({
  isOpen,
  onClose,
  roleId,
  userId,
}: ClaimShareCodeModalProps) {
  const [step, setStep] = useState<'enter_code' | 'confirm' | 'success'>(
    'enter_code'
  );
  const [shareCode, setShareCode] = useState('');
  const [validatedInvite, setValidatedInvite] = useState<any>(null);
  const { toast } = useToast();

  const validateMutation = trpc.personSharing.validateInvite.useMutation({
    onSuccess: (data) => {
      if (data.valid && data.invite) {
        setValidatedInvite(data.invite);
        setStep('confirm');
      } else {
        toast({
          title: 'Invalid Code',
          description: data.error || 'This share code is not valid',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const claimMutation = trpc.personSharing.claimInvite.useMutation({
    onSuccess: () => {
      setStep('success');
      toast({
        title: 'Success',
        description: 'Connection established successfully',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleValidate = () => {
    if (!shareCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a share code',
        variant: 'destructive',
      });
      return;
    }

    validateMutation.mutate(shareCode.trim());
  };

  const handleClaim = () => {
    claimMutation.mutate({
      inviteCode: shareCode,
      claimingRoleId: roleId,
      claimingUserId: userId,
    });
  };

  const handleClose = () => {
    setStep('enter_code');
    setShareCode('');
    setValidatedInvite(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 'enter_code' && 'Enter Share Code'}
                {step === 'confirm' && 'Confirm Connection'}
                {step === 'success' && 'Connection Established!'}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Step 1: Enter Code */}
            {step === 'enter_code' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Code
                  </label>
                  <Input
                    type="text"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value)}
                    placeholder="e.g., happy-turtle-jump"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 3-word code you received
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleValidate}
                    disabled={validateMutation.isPending}
                    className="flex-1"
                  >
                    {validateMutation.isPending ? 'Validating...' : 'Continue'}
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Confirm */}
            {step === 'confirm' && validatedInvite && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    {validatedInvite.ownerRole.user.image && (
                      <img
                        src={validatedInvite.ownerRole.user.image}
                        alt={validatedInvite.ownerRole.user.name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {validatedInvite.ownerRole.user.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        wants to share{' '}
                        {validatedInvite.shareType === 'FULL_ROLE'
                          ? 'full access'
                          : validatedInvite.ownerPerson?.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Permission Level:</span>
                      <span className="font-medium capitalize">
                        {validatedInvite.permissions.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">
                        {new Date(validatedInvite.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('enter_code')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleClaim}
                    disabled={claimMutation.isPending}
                    className="flex-1"
                  >
                    {claimMutation.isPending ? 'Connecting...' : 'Accept'}
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <>
                <div className="py-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600">
                    You are now connected! Shared data will appear in your
                    dashboard.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleClose} className="px-8">
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
```

---

### 3. Shared Person Card Component

**File:** `/components/person/SharedPersonCard.tsx`

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle } from 'lucide-react';

interface SharedPersonCardProps {
  person: {
    id: string;
    name: string;
    avatar?: string;
    isShared: boolean;
    sharedBy?: string;
    sharedByImage?: string;
    permissions?: string;
  };
  onClick: () => void;
}

export function SharedPersonCard({ person, onClick }: SharedPersonCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
        person.isShared ? 'border-2 border-blue-300 bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {person.avatar ? (
          <img
            src={person.avatar}
            alt={person.name}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{person.name}</h3>
          {person.isShared && (
            <div className="flex items-center gap-2 mt-1">
              {person.sharedByImage && (
                <img
                  src={person.sharedByImage}
                  alt={person.sharedBy}
                  className="w-4 h-4 rounded-full"
                />
              )}
              <p className="text-xs text-blue-600">
                Shared by {person.sharedBy}
              </p>
            </div>
          )}
        </div>

        {person.isShared && (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {person.permissions === 'VIEW'
              ? 'View Only'
              : person.permissions === 'EDIT'
              ? 'Can Edit'
              : 'Full Access'}
          </Badge>
        )}
      </div>
    </Card>
  );
}
```

---

## API Routes (tRPC)

### Person Sharing Router

**File:** `/lib/trpc/routers/person-sharing.ts`

```typescript
import { router, authorizedProcedure } from '../init';
import { z } from 'zod';
import {
  generatePersonSharingInvite,
  validatePersonSharingInvite,
  claimPersonSharingInvite,
  revokePersonSharingConnection,
  getPersonSharingConnections,
} from '@/lib/services/person-sharing-code';
import {
  hasAccessToPerson,
  getAccessiblePersons,
} from '@/lib/services/person-sharing-access';

export const personSharingRouter = router({
  /**
   * Generate person sharing invite
   */
  generateInvite: authorizedProcedure
    .input(
      z.object({
        ownerRoleId: z.string().cuid(),
        ownerPersonId: z.string().cuid().optional(),
        shareType: z.enum(['PERSON', 'ROUTINE_ACCESS', 'FULL_ROLE']),
        permissions: z.enum(['VIEW', 'EDIT', 'MANAGE']),
        contextData: z.any().optional(),
        expiresInDays: z.number().min(1).max(365).default(90),
        maxUses: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const code = await generatePersonSharingInvite(input);
      return { code };
    }),

  /**
   * Validate person sharing invite
   */
  validateInvite: authorizedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return await validatePersonSharingInvite(input);
    }),

  /**
   * Claim person sharing invite
   */
  claimInvite: authorizedProcedure
    .input(
      z.object({
        inviteCode: z.string(),
        claimingRoleId: z.string().cuid(),
        claimingUserId: z.string(),
        contextData: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await claimPersonSharingInvite(input);
    }),

  /**
   * Revoke connection
   */
  revokeConnection: authorizedProcedure
    .input(
      z.object({
        connectionId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      return await revokePersonSharingConnection(
        input.connectionId,
        ctx.user.id
      );
    }),

  /**
   * Get my connections (owned or shared with me)
   */
  getConnections: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        type: z.enum(['owned', 'shared_with_me']),
      })
    )
    .query(async ({ input }) => {
      return await getPersonSharingConnections(input.roleId, input.type);
    }),

  /**
   * Get accessible persons for a role
   */
  getAccessiblePersons: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      return await getAccessiblePersons(input.roleId, ctx.user.id);
    }),

  /**
   * Check access to person
   */
  checkAccess: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        personId: z.string().cuid(),
        requiredPermission: z.enum(['VIEW', 'EDIT', 'MANAGE']).default('VIEW'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      const hasAccess = await hasAccessToPerson(
        ctx.user.id,
        input.roleId,
        input.personId,
        input.requiredPermission
      );

      return { hasAccess };
    }),
});
```

---

## Security Considerations

### 1. Firestore-style Security Rules (PostgreSQL RLS)

```sql
-- Enable Row Level Security
ALTER TABLE person_sharing_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_sharing_connections ENABLE ROW LEVEL SECURITY;

-- Invites: Users can only see invites they created or that are active (for claiming)
CREATE POLICY invite_owner_policy ON person_sharing_invites
  FOR SELECT
  USING (
    owner_role_id IN (SELECT id FROM roles WHERE user_id = auth.uid())
    OR status = 'ACTIVE'
  );

CREATE POLICY invite_create_policy ON person_sharing_invites
  FOR INSERT
  WITH CHECK (
    owner_role_id IN (SELECT id FROM roles WHERE user_id = auth.uid())
  );

CREATE POLICY invite_update_policy ON person_sharing_invites
  FOR UPDATE
  USING (
    owner_role_id IN (SELECT id FROM roles WHERE user_id = auth.uid())
  );

-- Connections: Users can see connections they own or are shared with
CREATE POLICY connection_view_policy ON person_sharing_connections
  FOR SELECT
  USING (
    owner_role_id IN (SELECT id FROM roles WHERE user_id = auth.uid())
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY connection_owner_policy ON person_sharing_connections
  FOR UPDATE
  USING (
    owner_role_id IN (SELECT id FROM roles WHERE user_id = auth.uid())
  );
```

### 2. API-Level Permission Checks

All API endpoints must verify:
1. User owns the resource OR
2. User has active sharing connection with appropriate permission level
3. Connection is not expired or revoked
4. Permission hierarchy is respected (VIEW < EDIT < MANAGE)

---

## Migration Path

### Phase 1: Schema Addition (Week 1)
1. Add new tables: `PersonSharingInvite`, `PersonSharingConnection`
2. Add enums: `ShareType`, `PermissionLevel`
3. Run migration on staging environment
4. Test with sample data

### Phase 2: Backend Services (Week 2)
1. Implement code generation service
2. Implement access control service
3. Create tRPC router
4. Write comprehensive tests

### Phase 3: Frontend Components (Week 3)
1. Build SharePersonModal
2. Build ClaimShareCodeModal
3. Update PersonList to show shared persons
4. Add sharing indicators to person cards

### Phase 4: Integration (Week 4)
1. Integrate into parent dashboard
2. Integrate into teacher dashboard
3. Update task completion queries
4. Add analytics for shared persons

### Phase 5: Migration & Testing (Week 5)
1. Migrate existing StudentParentConnection data
2. Comprehensive E2E testing
3. Security audit
4. Performance testing

### Phase 6: Deployment (Week 6)
1. Deploy to staging
2. User acceptance testing
3. Production deployment
4. Monitor and iterate

---

## Testing Strategy

### Unit Tests
- Code generation uniqueness
- Permission validation
- Access control logic
- Expiration handling

### Integration Tests
- Full invite flow (generate → claim → access)
- Cross-role sharing scenarios
- Permission inheritance
- Data access filtering

### E2E Tests
- Parent-to-parent sharing
- Teacher-to-teacher sharing
- Parent-to-teacher sharing
- Teacher-to-parent sharing
- Multiple connections per person
- Revocation flow

---

## Success Metrics

1. **Adoption Rate**: % of users who create at least one sharing connection
2. **Connection Types**: Distribution of PERSON vs FULL_ROLE shares
3. **Permission Usage**: Distribution of VIEW vs EDIT vs MANAGE
4. **Cross-Role Shares**: Number of parent↔teacher connections
5. **Code Success Rate**: % of generated codes that are claimed
6. **Time to Claim**: Average time between code generation and claiming

---

## Future Enhancements

1. **Temporary Shares**: Time-limited connections (e.g., babysitter for weekend)
2. **Notification System**: Alert owners when codes are claimed
3. **Bulk Sharing**: Share multiple persons with one code
4. **Share Templates**: Pre-configured permission sets
5. **Activity Log**: Track all sharing-related actions
6. **Granular Permissions**: Per-routine or per-task sharing
7. **Share Groups**: Share with multiple recipients at once
8. **Emergency Access**: Temporary override for critical situations

---

## Conclusion

This implementation extends kidtrek's proven student-parent sharing pattern to support flexible person-to-person sharing in rubyroutines. The design:

✅ **Maintains backward compatibility** with existing StudentParentConnection model
✅ **Supports all required scenarios** (co-parent, co-teacher, cross-role)
✅ **Uses familiar patterns** from marketplace sharing (3-word codes, expiration)
✅ **Provides granular permissions** (View/Edit/Manage)
✅ **Scales to future use cases** (flexible ShareType enum)
✅ **Ensures security** through RLS and permission checks

The phased rollout minimizes risk while delivering value incrementally. Each phase can be tested and validated before proceeding to the next.
