# Quick Reference Guide - Code Quality Improvements

## Type Definitions

### Import Types
```tsx
import type {
  Person,
  PersonWithAssignments,
  Routine,
  RoutineWithTasks,
  Task,
  TaskWithCompletions,
  Goal,
  GoalWithLinks,
} from '@/lib/types/database';
```

### Use in Components
```tsx
interface MyComponentProps {
  person: Person;
  routine: RoutineWithTasks;
}

function MyComponent({ person, routine }: MyComponentProps) {
  // Full type safety and IntelliSense
}
```

## Avatar Utilities

### Parse Avatar
```tsx
import { useAvatar, parseAvatar } from '@/lib/utils/avatar';

// In React components (recommended)
const { color, emoji, backgroundColor } = useAvatar({
  avatarString: person.avatar,
  fallbackName: person.name,
  opacity: '20', // optional, defaults to '20'
});

// In non-React code
const { color, emoji } = parseAvatar(person.avatar, person.name);
```

### Available Constants
```tsx
import { PASTEL_COLORS, COMMON_EMOJIS } from '@/lib/utils/avatar';

// 32 pastel colors
PASTEL_COLORS[0] // '#FFB3BA'

// 65+ emojis with searchable keywords
COMMON_EMOJIS[0] // { emoji: '😀', name: 'smile', keywords: 'happy smile face' }
```

## Formatting Utilities

```tsx
import {
  formatDate,
  formatResetPeriod,
  formatPercentage,
  formatRelativeTime,
  pluralize,
} from '@/lib/utils/format';

// Dates
formatDate(new Date(), 'short') // "Jan 15, 2024"
formatDate(new Date(), 'long')  // "Monday, January 15, 2024"
formatDate(new Date(), 'time')  // "3:45 PM"
formatRelativeTime(date)        // "2 hours ago"

// Reset Periods
formatResetPeriod('DAILY')           // "Daily"
formatResetPeriod('WEEKLY', 1)       // "Weekly (Monday)"
formatResetPeriod('MONTHLY', 15)     // "Monthly (Day 15)"

// Numbers
formatPercentage(75, 100)       // "75%"
formatPercentage(2, 3, 1)       // "66.7%"

// Pluralization
pluralize(1, 'child')           // "child"
pluralize(5, 'child', 'children') // "children"
```

## Mutation Hooks

### Basic Usage
```tsx
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from '@/lib/hooks';

// Create
const createMutation = trpc.person.create.useMutation();
const { mutate: createPerson, isLoading } = useCreateMutation(createMutation, {
  entityName: 'Person',
  invalidateQueries: [() => utils.person.list.invalidate()],
  closeDialog: () => setIsOpen(false),
});

// Use it
createPerson({ roleId, name, avatar });
```

### Advanced Usage
```tsx
import { useMutationWithToast } from '@/lib/hooks';

const mutation = trpc.custom.action.useMutation();
const { mutate, isLoading } = useMutationWithToast(mutation, {
  messages: {
    loading: 'Processing...',
    success: 'Action completed successfully!',
    error: 'Failed to complete action',
  },
  callbacks: {
    onSuccess: (data) => {
      console.log('Success!', data);
    },
    onError: (error) => {
      console.error('Error!', error);
    },
  },
  invalidateQueries: [
    () => utils.query1.invalidate(),
    () => utils.query2.invalidate(),
  ],
  closeDialog: () => setIsOpen(false),
});
```

## Authentication Hooks

### Auth Guard
```tsx
import { useAuthGuard, useHasRole } from '@/lib/hooks';

// Protect a page (auto-redirects)
function MyPage() {
  const { user, isLoading } = useAuthGuard({
    redirectTo: '/login',
    requireRole: 'PARENT',
    roleRedirectTo: '/dashboard',
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>Welcome, {user.name}!</div>;
}

// Check role
function MyComponent() {
  const isParent = useHasRole('PARENT');

  if (isParent) {
    return <ParentView />;
  }
}
```

### Ownership Checks
```tsx
import { useRoleOwnership, useOwnsResource } from '@/lib/hooks';

// Check if user owns a role
const { ownsRole, role } = useRoleOwnership({ roleId: 'role_123' });

// Check if user owns a resource
const canEdit = useOwnsResource(routine.roleId);
```

## Logging

### Basic Logging
```tsx
import { logger } from '@/lib/utils/logger';

// Debug (dev only)
logger.debug('Debug info', { data });

// Info
logger.info('User action', { userId, action: 'create' });

// Warning
logger.warn('Deprecated feature used', { feature: 'oldAPI' });

// Error
logger.error('Operation failed', error, {
  userId,
  operation: 'createPerson',
});

// Audit (sensitive operations)
logger.audit('Role changed', {
  userId,
  oldRole: 'FREE',
  newRole: 'PREMIUM',
});
```

### Named Loggers
```tsx
import { authLogger, dbLogger, apiLogger } from '@/lib/utils/logger';

authLogger.info('Login successful', { userId });
dbLogger.warn('Slow query detected', { query, duration });
apiLogger.error('API call failed', error, { endpoint });
```

## Constants

### Tier Limits
```tsx
import { TIER_LIMITS } from '@/lib/utils/constants';

const canCreate = persons.length < TIER_LIMITS[userTier].persons;
```

### Validation Rules
```tsx
import { VALIDATION } from '@/lib/utils/constants';

<Input maxLength={VALIDATION.name.maxLength} />
```

### Error Messages
```tsx
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/utils/constants';

toast({
  title: 'Error',
  description: ERROR_MESSAGES.unauthorized,
});

toast({
  title: 'Success',
  description: SUCCESS_MESSAGES.created,
});
```

### UI Constants
```tsx
import { TOAST_DURATION, CONFETTI_DURATION } from '@/lib/utils/constants';

setTimeout(() => hideToast(), TOAST_DURATION);
```

## Error Boundaries

### Page-Level
```tsx
import { PageErrorBoundary } from '@/components/error-boundary';

export default function Layout({ children }) {
  return (
    <PageErrorBoundary>
      {children}
    </PageErrorBoundary>
  );
}
```

### Component-Level
```tsx
import { ComponentErrorBoundary } from '@/components/error-boundary';

function ParentComponent() {
  return (
    <ComponentErrorBoundary componentName="TaskList">
      <TaskList />
    </ComponentErrorBoundary>
  );
}
```

### Custom Error UI
```tsx
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Custom error handling
    sendToErrorTracking(error);
  }}
  showDetails={isDevelopment}
>
  <MyComponent />
</ErrorBoundary>
```

## Performance Optimization

### React.memo for List Items
```tsx
import { memo } from 'react';

export const PersonCard = memo(function PersonCard({ person }) {
  // Component only re-renders when person changes
  return <div>...</div>;
});
```

### Batch Queries
```tsx
import { calculateGoalProgressBatch } from '@/lib/services/goal-progress';

// Before: N queries
for (const goalId of goalIds) {
  await calculateGoalProgress(goalId);
}

// After: 1 query
const progressMap = await calculateGoalProgressBatch(goalIds);
```

## Cheat Sheet

### Component Template
```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAvatar, useCreateMutation } from '@/lib/hooks';
import { formatDate } from '@/lib/utils/format';
import { logger } from '@/lib/utils/logger';
import type { Person } from '@/lib/types/database';

interface MyComponentProps {
  person: Person;
}

export function MyComponent({ person }: MyComponentProps) {
  const utils = trpc.useUtils();
  const { color, emoji } = useAvatar({
    avatarString: person.avatar,
    fallbackName: person.name,
  });

  const createMutation = trpc.entity.create.useMutation();
  const { mutate, isLoading } = useCreateMutation(createMutation, {
    entityName: 'Entity',
    invalidateQueries: [() => utils.entity.list.invalidate()],
  });

  const handleSubmit = () => {
    try {
      mutate({ data });
      logger.info('Entity created', { entityId: data.id });
    } catch (error) {
      logger.error('Failed to create entity', error);
    }
  };

  return <div>...</div>;
}
```

## Common Patterns

### Avatar Display
```tsx
const { color, emoji, backgroundColor } = useAvatar({
  avatarString: person.avatar,
  fallbackName: person.name,
});

<div
  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
  style={{ backgroundColor }}
>
  {emoji}
</div>
```

### Protected Route
```tsx
const { user, isLoading } = useAuthGuard({
  redirectTo: '/login',
  requireRole: 'PARENT',
});

if (isLoading) return <LoadingSpinner />;
```

### Form with Mutation
```tsx
const { mutate, isLoading } = useCreateMutation(createMutation, {
  entityName: 'Person',
  invalidateQueries: [() => utils.person.list.invalidate()],
  closeDialog: onClose,
});

const handleSubmit = (e) => {
  e.preventDefault();
  mutate({ data });
};
```

### Error Handling
```tsx
try {
  await somethingRisky();
  logger.info('Operation successful');
} catch (error) {
  logger.error('Operation failed', error, { context });
  throw error;
}
```
