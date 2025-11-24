/**
 * Example Usage of Optimistic Mutations
 *
 * This file demonstrates how to use the optimistic mutation hooks
 * throughout the application for instant UI feedback.
 */

'use client';

import { trpc } from '@/lib/trpc/client';
import {
  useOptimisticCreate,
  useOptimisticUpdate,
  useOptimisticDelete,
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation
} from '@/lib/hooks';

// ============================================
// EXAMPLE 1: Person Create with Optimistic Updates
// ============================================

export function PersonCreateExample() {
  const utils = trpc.useUtils();

  // Option A: Using the specialized optimistic create hook
  const createMutation = trpc.person.create.useMutation();
  const { mutate: createPerson } = useOptimisticCreate(createMutation, {
    entityName: 'Person',
    listKey: ['person', 'list'],
    createItem: (input, tempId) => ({
      id: tempId,
      name: input.name,
      avatar: input.avatar || null,
      roleId: input.roleId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    invalidateKeys: [
      ['person', 'list'],
    ],
    onSuccess: () => {
      console.log('Person created successfully');
    },
  });

  // Option B: Using the simplified helper with optimistic enabled
  const createMutation2 = trpc.person.create.useMutation();
  const { mutate: createPerson2 } = useCreateMutation(createMutation2, {
    entityName: 'Person',
    optimistic: true,
    listKey: ['person', 'list'],
    createItem: (input, tempId) => ({
      id: tempId,
      ...input,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    invalidateQueries: [() => utils.person.list.invalidate()],
  });

  const handleCreate = () => {
    // UI updates instantly, server request happens in background
    createPerson({
      name: 'John Doe',
      roleId: 'role-123',
      avatar: 'bear',
    });
  };

  return (
    <button onClick={handleCreate}>
      Create Person (Optimistic)
    </button>
  );
}

// ============================================
// EXAMPLE 2: Person Update with Optimistic Updates
// ============================================

export function PersonUpdateExample({ person }: { person: any }) {
  const utils = trpc.useUtils();

  const updateMutation = trpc.person.update.useMutation();
  const { mutate: updatePerson } = useOptimisticUpdate(updateMutation, {
    entityName: 'Person',
    listKey: ['person', 'list'],
    itemKey: ['person', 'getById', { id: person.id }],
    getId: (input) => input.id,
    updateItem: (item, input) => ({
      ...item,
      ...input,
      updatedAt: new Date(),
    }),
    invalidateKeys: [
      ['person', 'list'],
      ['person', 'getById', { id: person.id }],
    ],
  });

  const handleUpdate = () => {
    // UI updates instantly
    updatePerson({
      id: person.id,
      name: 'Updated Name',
      avatar: 'rabbit',
    });
  };

  return (
    <button onClick={handleUpdate}>
      Update Person (Optimistic)
    </button>
  );
}

// ============================================
// EXAMPLE 3: Person Delete with Optimistic Updates
// ============================================

export function PersonDeleteExample({ personId }: { personId: string }) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.person.delete.useMutation();
  const { mutate: deletePerson } = useOptimisticDelete(deleteMutation, {
    entityName: 'Person',
    listKey: ['person', 'list'],
    getId: (input) => input.id,
    invalidateKeys: [
      ['person', 'list'],
    ],
  });

  const handleDelete = () => {
    // Person disappears from UI instantly
    deletePerson({ id: personId });
  };

  return (
    <button onClick={handleDelete}>
      Delete Person (Optimistic)
    </button>
  );
}

// ============================================
// EXAMPLE 4: Task Check-in (Already Implemented)
// ============================================

export function TaskCheckinExample() {
  // See components/person/person-checkin-modal.tsx for implementation
  // and app/kiosk/[code]/tasks/page.tsx for kiosk implementation

  return (
    <div>
      <p>Task check-ins already use optimistic updates!</p>
      <p>Check the following files for examples:</p>
      <ul>
        <li>components/person/person-checkin-modal.tsx</li>
        <li>app/kiosk/[code]/tasks/page.tsx</li>
      </ul>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Routine Create with Optimistic Updates
// ============================================

export function RoutineCreateExample() {
  const utils = trpc.useUtils();

  const createMutation = trpc.routine.create.useMutation();
  const { mutate: createRoutine } = useOptimisticCreate(createMutation, {
    entityName: 'Routine',
    listKey: ['routine', 'list'],
    createItem: (input, tempId) => ({
      id: tempId,
      name: input.name,
      description: input.description,
      resetPeriod: input.resetPeriod,
      resetDay: input.resetDay,
      roleId: input.roleId,
      isTeacherOnly: input.isTeacherOnly || false,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
      assignments: [],
    }),
    invalidateKeys: [
      ['routine', 'list'],
    ],
  });

  const handleCreate = () => {
    createRoutine({
      name: 'Morning Routine',
      description: 'Daily morning tasks',
      resetPeriod: 'DAILY',
      roleId: 'role-123',
    });
  };

  return (
    <button onClick={handleCreate}>
      Create Routine (Optimistic)
    </button>
  );
}

// ============================================
// EXAMPLE 6: Migration Guide
// ============================================

export function MigrationGuide() {
  return (
    <div>
      <h2>Migration Guide: Adding Optimistic Updates</h2>

      <h3>Step 1: Find existing mutations</h3>
      <pre>{`
// Before (waits for server):
const mutation = trpc.person.create.useMutation({
  onSuccess: () => {
    utils.person.list.invalidate();
    toast({ title: 'Success' });
  }
});
      `}</pre>

      <h3>Step 2: Wrap with optimistic hook</h3>
      <pre>{`
// After (instant UI update):
const baseMutation = trpc.person.create.useMutation();
const mutation = useOptimisticCreate(baseMutation, {
  entityName: 'Person',
  listKey: ['person', 'list'],
  createItem: (input, tempId) => ({
    id: tempId,
    ...input,
    // Add default values
  }),
});
      `}</pre>

      <h3>Step 3: Use the same way</h3>
      <pre>{`
// Usage remains the same!
mutation.mutate({ name: 'John' });
      `}</pre>
    </div>
  );
}

// ============================================
// EXAMPLE 7: Network Status Handling
// ============================================

export function NetworkAwareComponent() {
  import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

  const { isOnline, status } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div>
        <p>You're currently offline.</p>
        <p>Changes will be saved when you reconnect.</p>
      </div>
    );
  }

  if (status === 'slow') {
    return (
      <div>
        <p>Slow connection detected.</p>
        <p>Changes may take longer to save.</p>
      </div>
    );
  }

  return (
    <div>
      <p>Connection is good!</p>
      <p>All changes are being saved instantly.</p>
    </div>
  );
}