# Stage 2: Core CRUD (Routines, Tasks, Persons, Groups)

**Duration:** 4-5 days  
**Token Estimate:** 120K tokens ($1.80)  
**Prerequisites:** Stage 1 completed (auth working, schema deployed)

---

## SESSION PROMPT (Copy-Paste This)

```
You are building Ruby Routines Stage 2: Core CRUD Operations.

CONTEXT:
- Project: Ruby Routines (routine management PWA)
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Stage Goal: Implement core CRUD for persons, groups, routines, tasks

COMPLETED IN PREVIOUS STAGE:
- Auth system working (email/password + OAuth)
- Database schema deployed
- RLS policies applied
- Project structure established

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
- Create/edit/delete children (parent mode)
- Create/edit/delete students (teacher mode)
- "Me" role (protected adult, auto-created)
- Soft delete (status: inactive)
- Restore inactive persons
- Color/emoji customization

**Routine Management:**
- Create routine
- Edit routine (name, reset period, visibility rules)
- Delete routine (soft delete)
- Copy routine to other children
- Reset period configuration (daily/weekly/monthly)
- Visibility rules (always, days, time, date-range)
- Temporary override (10-60 min duration)
- Protected routines (cannot delete)

**Task Management:**
- Create task (all types)
- Edit task
- Delete task (with dependency check)
- Reorder tasks within routine
- Task types: Simple, Multiple Check-in, Progress
- Task completion tracking
- Undo functionality (simple tasks, 5-min window)
- Task aggregation display

**Dashboards:**
- Parent dashboard (children list, routines)
- Teacher dashboard (classrooms, students, routines)
- Mode switcher (dual-role)
- Invisible routines section (collapsible)

TECH REQUIREMENTS:
- tRPC for all APIs
- Zod validation schemas
- React Query for caching
- Optimistic updates
- Error handling with typed errors
- Loading states
- Toast notifications (sonner)

CODING RULES:
- TypeScript strict mode (no 'any')
- Use Server Components where possible
- Client Components only when needed (interactivity)
- tRPC for all data fetching/mutations
- Zod for validation
- React Query for caching (stale-while-revalidate)
- Optimistic updates for mutations
- Error boundaries for components
- Loading skeletons (not spinners)
- Toast notifications for success/error
- Confirm dialogs for destructive actions

TESTING REQUIREMENTS:
- Person CRUD tests
- Routine CRUD tests
- Task CRUD tests
- Reset period calculation tests
- Visibility rule evaluation tests
- Tier limit enforcement tests
- Soft delete behavior tests

BEGIN IMPLEMENTATION:
Start with Person management, then Groups, then Routines, then Tasks.
Implement one entity at a time with full CRUD before moving to next.
Show working code with minimal explanation.
Test each component before proceeding.
```

---

## Deliverables Checklist

```
PERSON MANAGEMENT:
□ Create/edit/delete person
□ Restore inactive person
□ Color/emoji picker

GROUP MANAGEMENT:
□ Create/edit/delete group
□ Add/remove members

ROUTINE MANAGEMENT:
□ Create/edit/delete routine
□ Reset period configuration
□ Visibility rules
□ Temporary override
□ Copy to other children

TASK MANAGEMENT:
□ Create/edit/delete task (all types)
□ Reorder tasks
□ Task completion tracking
□ Undo functionality

DASHBOARDS:
□ Parent dashboard
□ Teacher dashboard
□ Mode switcher
□ Invisible routines section
```

---

## Next Stage

After completing Stage 2, proceed to:
**[Stage 3: Goals & Smart Routines](stage-3.md)**
