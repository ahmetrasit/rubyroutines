# Stage 2: Core CRUD (Routines, Tasks, Persons, Groups)

**Duration:** 4-5 days  
**Token Estimate:** 120K tokens ($1.80)  
**Prerequisites:** Stage 1 completed (auth working, schema deployed)

---

## 📋 SESSION PROMPT (Copy-Paste This)

```
You are building Ruby Routines Stage 2: Core CRUD Operations.

CONTEXT:
- Project: Ruby Routines (routine management PWA)
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Stage Goal: Implement core CRUD for persons, groups, routines, tasks

COMPLETED IN PREVIOUS STAGE:
- Auth system working (email/password + OAuth)
- Database schema deployed (all tables)
- RLS policies applied (all entities)
- Project structure established
- Supabase connected

CURRENT STAGE OBJECTIVES:
1. Person management (children, adults, "Me" roles)
2. Group management (families, classrooms, rooms)
3. Routine CRUD (regular routines only, not smart yet)
4. Task CRUD (simple, multiple check-in, progress tasks)
5. Task completion tracking
6. Reset period logic (daily, weekly, monthly)
7. Visibility rules (time, day, date-range)
8. Temporary visibility override
9. Soft delete system
10. Parent & Teacher dashboards (basic layout)
11. Dual-role account system (mode switching)

FEATURES TO IMPLEMENT:

**Person Management:**
- Create person (child/adult)
- Edit person (name, color, emoji)
- Delete person (soft delete, status: inactive)
- Restore inactive person
- List persons (active only by default)
- Protected "Me" role (auto-created, cannot delete)
- Color/emoji picker (32 pastel colors)

**Group Management:**
- Create group (family/classroom)
- Edit group (name)
- Delete group (soft delete)
- Add members to group
- Remove members from group
- Auto-create family group (parent mode)
- Auto-create adult-only classroom (teacher mode)
- Group membership tracking

**Routine CRUD:**
- Create routine (name, reset period, visibility)
- Edit routine (all properties)
- Delete routine (soft delete, check protected)
- Copy routine to other children (cross-group)
- Reset period configuration:
  - Daily: Resets 11:55 PM
  - Weekly: User selects day (0-6), resets 11:55 PM that day
  - Monthly: User selects day (1-28 or 99=last day), resets 11:55 PM
- Visibility rules:
  - Always visible (default)
  - Day-based: Weekdays, weekends, custom days
  - Time-based: Start time - End time (12-hour format)
  - Date-based: MM-DD to MM-DD (annual window, leap year safe)
  - Midnight crossing: Display as "10 PM - 2 AM +1"
- Temporary visibility override:
  - Duration: 10, 20, 30, 40, 50, 60 minutes
  - Countdown display
  - Manual cancel
  - Auto-revert after duration
- Protected routines (cannot delete)
- Invisible routines section (collapsible, dashboard only)

**Task CRUD:**
- Create task (name, description, type)
- Edit task (all properties)
- Delete task (soft delete, check dependencies)
- Reorder tasks (drag-drop or up/down arrows)
- Task types:
  1. Simple: Checkbox with 5-min undo window (admin-configurable)
  2. Multiple Check-in: Reappearing checkbox with aggregation counter
  3. Progress: Input + record button + total display
- Task completion:
  - Mark complete/incomplete (simple)
  - Record check-in (multiple check-in)
  - Record value (progress)
  - Timestamp all completions
  - Undo within window (simple tasks only)
- Task ordering within routine:
  1. Top: Regular tasks linked to goals/conditions
  2. Middle: Regular tasks not linked
  3. Bottom: Smart tasks (placeholder for Stage 3)
- Task aggregation display:
  - Simple: Completed or not
  - Multiple check-in: "X completions today"
  - Progress: "X total this period"

**Dashboards:**
- Parent dashboard:
  - Children list with avatars
  - Click child → view routines
  - Quick add routine button
  - Mode switcher (if dual-role)
  - Invisible routines section (collapsible)
- Teacher dashboard:
  - Classrooms list
  - Click classroom → view students
  - Click student → view routines
  - Quick add routine button
  - Mode switcher (if dual-role)
  - Invisible routines section (collapsible)
- Dual-role mode switching:
  - Toggle between parent/teacher
  - Separate screens per mode
  - Data isolation enforced
  - Active role indicator

**Tier Limits (Enforcement):**
Before create/copy, check:
- Children per family (Free: 3, Bronze: 5, Gold: 10, Pro: 50)
- Students per classroom (Free: 24, Bronze: 50, Gold: 100, Pro: 500)
- Regular routines per person (Free: 2, Bronze: 5, Gold: 10, Pro: 50)
- Tasks per routine (Free: 5, Bronze: 10, Gold: 20, Pro: 100)
Abort operation if limit exceeded, show error with upgrade prompt.

FILE STRUCTURE TO CREATE:
/app/(dashboard)
  /parent
    /page.tsx (parent dashboard)
    /[childId]
      /page.tsx (child detail with routines)
      /routines/[routineId]
        /page.tsx (routine detail with tasks)
  /teacher
    /page.tsx (teacher dashboard)
    /[classroomId]
      /page.tsx (classroom detail with students)
      /[studentId]
        /page.tsx (student detail with routines)
  /layout.tsx (mode switcher in header)
  
/components
  /person
    /person-list.tsx
    /person-form.tsx
    /person-card.tsx
    /restore-person-dialog.tsx
    /color-emoji-picker.tsx
  /group
    /group-list.tsx
    /group-form.tsx
  /routine
    /routine-list.tsx
    /routine-form.tsx
    /routine-card.tsx
    /routine-visibility-form.tsx
    /routine-copy-dialog.tsx
    /visibility-override-dialog.tsx
    /invisible-routines-section.tsx
  /task
    /task-list.tsx
    /task-form.tsx
    /task-item.tsx
    /task-completion.tsx
    /task-simple-checkbox.tsx
    /task-multiple-checkin.tsx
    /task-progress-input.tsx
  /dashboard
    /mode-switcher.tsx
    /dashboard-header.tsx
    
/lib/trpc/routers
  /person.ts (CRUD + restore + tier limits)
  /group.ts (CRUD + membership)
  /routine.ts (CRUD + copy + visibility + override)
  /task.ts (CRUD + completion + reorder)
  
/lib/services
  /reset-period.ts (calculate next reset time)
  /visibility-rules.ts (check if routine visible now)
  /tier-limits.ts (check limits before create)
  /soft-delete.ts (handle inactive status)
  /task-ordering.ts (sort tasks by priority)
  
/lib/validation
  /person.ts (Zod schemas)
  /routine.ts (Zod schemas)
  /task.ts (Zod schemas)
  
/lib/hooks
  /use-persons.ts (React Query hooks)
  /use-routines.ts
  /use-tasks.ts
  /use-visibility.ts
  /use-mode.ts (dual-role mode switching)

CODING RULES:
- TypeScript strict mode (no 'any' types)
- Use Server Components where possible
- Client Components only when needed (forms, interactive)
- tRPC for all data fetching/mutations
- Zod for all validation
- React Query for caching (staleTime: 60000)
- Optimistic updates for all mutations
- Error boundaries for all pages
- Loading skeletons (not spinners)
- Toast notifications (sonner) for success/error
- Confirm dialogs for destructive actions
- Max 200 lines per file

DATA VALIDATION REQUIREMENTS:
- Person: firstName required (1-50 chars), lastName optional
- Routine: name required (1-100 chars), reset period required
- Task: name required (1-100 chars), type required
- Color: Hex format (#RRGGBB)
- Emoji: Single emoji character
- Reset day: 0-6 (weekly), 1-28 or 99 (monthly)
- Time: HH:mm format (12-hour with AM/PM)
- Date: MM-DD format

TESTING REQUIREMENTS:
- Person CRUD tests (create, read, update, delete, restore)
- Routine CRUD tests (all operations)
- Task CRUD tests (all types)
- Reset period calculation tests (all periods)
- Visibility rule evaluation tests (all rules)
- Tier limit enforcement tests (all limits)
- Soft delete behavior tests
- Task ordering tests

BEGIN IMPLEMENTATION:
Start with Person management.
Then Group management.
Then Routine CRUD.
Then Task CRUD.
Implement one entity at a time with full CRUD before moving to next.
Show working code with minimal explanation.
Test each component before proceeding to next.
Use optimistic updates for better UX.
```

---

## 📦 Complete Implementation

### Step 1: Person Management (Day 1 Morning)

**tRPC Router** (`/lib/trpc/routers/person.ts`):
```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../init'
import { PersonStatus, PersonType } from '@prisma/client'
import { checkTierLimit } from '@/lib/services/tier-limits'
import { TRPCError } from '@trpc/server'

const personSchema = z.object({
  roleId: z.string().cuid(),
  type: z.nativeEnum(PersonType),
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  emoji: z.string().emoji().optional()
})

export const personRouter = router({
  list: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      includeInactive: z.boolean().optional().default(false)
    }))
    .query(async ({ ctx, input }) => {
      const persons = await ctx.prisma.person.findMany({
        where: {
          roleId: input.roleId,
          status: input.includeInactive ? undefined : PersonStatus.ACTIVE
        },
        orderBy: { firstName: 'asc' }
      })
      
      return persons
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.id },
        include: {
          routines: {
            where: { status: 'ACTIVE' },
            include: { tasks: true }
          }
        }
      })
      
      if (!person) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      
      return person
    }),

  create: protectedProcedure
    .input(personSchema)
    .mutation(async ({ ctx, input }) => {
      // Check tier limit
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        include: { persons: { where: { status: 'ACTIVE', type: 'CHILD' } } }
      })
      
      if (!role) throw new TRPCError({ code: 'NOT_FOUND' })
      
      const limitKey = role.type === 'PARENT' ? 'children_per_family' : 'students_per_classroom'
      await checkTierLimit(role.tier, limitKey, role.persons.length)
      
      // Check for inactive person with same name
      const existing = await ctx.prisma.person.findFirst({
        where: {
          roleId: input.roleId,
          firstName: input.firstName,
          lastName: input.lastName,
          status: PersonStatus.INACTIVE
        }
      })
      
      if (existing) {
        throw new TRPCError({ 
          code: 'CONFLICT',
          message: 'PERSON_EXISTS_INACTIVE'
        })
      }
      
      // Create person
      const person = await ctx.prisma.person.create({
        data: input
      })
      
      return person
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().max(50).optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      emoji: z.string().emoji().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      
      const person = await ctx.prisma.person.update({
        where: { id },
        data
      })
      
      return person
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if protected
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.id }
      })
      
      if (person?.isProtected) {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Cannot delete protected person'
        })
      }
      
      // Soft delete
      const deleted = await ctx.prisma.person.update({
        where: { id: input.id },
        data: { status: PersonStatus.INACTIVE }
      })
      
      return deleted
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const person = await ctx.prisma.person.update({
        where: { id: input.id },
        data: { status: PersonStatus.ACTIVE }
      })
      
      return person
    })
})
```

**Person List Component** (`/components/person/person-list.tsx`):
```typescript
'use client'

import { trpc } from '@/lib/trpc/client'
import { PersonCard } from './person-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { PersonForm } from './person-form'
import { RestorePersonDialog } from './restore-person-dialog'

interface PersonListProps {
  roleId: string
}

export function PersonList({ roleId }: PersonListProps) {
  const [showForm, setShowForm] = useState(false)
  const [showRestore, setShowRestore] = useState(false)
  
  const { data: persons, isLoading } = trpc.person.list.useQuery({ roleId })
  const { data: inactivePersons } = trpc.person.list.useQuery({ 
    roleId, 
    includeInactive: true 
  })
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  const hasInactive = (inactivePersons?.length ?? 0) > (persons?.length ?? 0)
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Children</h2>
        <div className="flex gap-2">
          {hasInactive && (
            <Button
              variant="outline"
              onClick={() => setShowRestore(true)}
            >
              Restore
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {persons?.map(person => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>
      
      {showForm && (
        <PersonForm
          roleId={roleId}
          onClose={() => setShowForm(false)}
        />
      )}
      
      {showRestore && (
        <RestorePersonDialog
          roleId={roleId}
          onClose={() => setShowRestore(false)}
        />
      )}
    </div>
  )
}
```

Continue with Day 1 Afternoon through Day 5...

---

## 📊 Reset Period Calculator

**Service** (`/lib/services/reset-period.ts`):
```typescript
import { ResetPeriod } from '@prisma/client'

export function calculateNextReset(
  period: ResetPeriod,
  resetDay?: number | null,
  resetTime: string = '23:55'
): Date {
  const now = new Date()
  const [hours, minutes] = resetTime.split(':').map(Number)
  const next = new Date(now)
  
  next.setHours(hours, minutes, 0, 0)
  
  switch (period) {
    case ResetPeriod.DAILY:
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      break
      
    case ResetPeriod.WEEKLY:
      if (!resetDay) throw new Error('resetDay required for weekly')
      next.setDate(next.getDate() + ((7 + resetDay - next.getDay()) % 7))
      if (next <= now) {
        next.setDate(next.getDate() + 7)
      }
      break
      
    case ResetPeriod.MONTHLY:
      if (!resetDay) throw new Error('resetDay required for monthly')
      
      if (resetDay === 99) {
        // Last day of month
        next.setMonth(next.getMonth() + 1, 0)
      } else {
        next.setDate(resetDay)
      }
      
      if (next <= now) {
        if (resetDay === 99) {
          next.setMonth(next.getMonth() + 2, 0)
        } else {
          next.setMonth(next.getMonth() + 1)
          next.setDate(resetDay)
        }
      }
      break
  }
  
  return next
}

export function shouldResetNow(routine: {
  resetPeriod: ResetPeriod
  resetDay?: number | null
  resetTime: string
  lastReset?: Date | null
}): boolean {
  const nextReset = calculateNextReset(
    routine.resetPeriod,
    routine.resetDay,
    routine.resetTime
  )
  
  return new Date() >= nextReset
}
```

---

## ✅ Stage 2 Complete When:

```
□ Can create/edit/delete persons
□ Can restore inactive persons
□ Can create/edit/delete groups
□ Can create/edit/delete routines
□ Can copy routines to other children
□ Reset periods calculate correctly
□ Visibility rules work (all types)
□ Can create/edit/delete tasks (all types)
□ Task completion tracking works
□ Undo works (simple tasks, 5-min window)
□ Soft delete system working
□ Parent dashboard functional
□ Teacher dashboard functional
□ Mode switcher working (dual-role)
□ Tier limits enforced
□ All tests passing
```

**Next:** [Stage 3: Goals & Smart Routines](STAGE-3-COMPLETE.md)
