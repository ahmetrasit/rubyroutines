# Stage 3: Goals & Smart Routines

**Duration:** 3-4 days  
**Token Estimate:** 80K tokens ($1.20)  
**Prerequisites:** Stage 2 completed (core CRUD working)

---

## 📋 SESSION PROMPT (Copy-Paste This)

```
You are building Ruby Routines Stage 3: Goals & Smart Routines.

CONTEXT:
- Project: Ruby Routines (routine management PWA)
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Stage Goal: Implement goal system and smart routines with conditions

COMPLETED IN PREVIOUS STAGES:
- Auth system working
- Person/Group management
- Routine CRUD (regular routines)
- Task CRUD (simple, multiple check-in, progress)
- Task completion tracking
- Reset periods working
- Visibility rules working
- Dashboards (parent/teacher)
- Dual-role mode switching

CURRENT STAGE OBJECTIVES:
1. Goal system (task-based + routine-based aggregation)
2. Goal progress calculation (real-time)
3. Goal achievement tracking
4. Goal linking UI ("Link to Goal" button on tasks/routines)
5. Multiple goals per task/routine
6. Cross-routine goal aggregation
7. Smart routines (upgrade regular → smart)
8. Condition system (visual builder)
9. Condition evaluation engine
10. Smart task visibility logic
11. Cross-routine conditions
12. Circular dependency prevention
13. Task deletion warnings (goal/condition dependencies)

GOAL SYSTEM REQUIREMENTS:

**Goal Structure:**
- Owned by person (adult or child)
- Created by adults (parents/teachers) only
- Period: Daily, Weekly, Monthly
- Target value (numeric, Decimal type)
- Links to multiple tasks AND/OR multiple routines
- Reset config same as routines (day + time)

**Goal Calculation Rules:**
Daily goals: Aggregate since last 11:55 PM
Weekly goals: Aggregate since last weekly reset day at 11:55 PM
Monthly goals: Aggregate since last monthly reset day at 11:55 PM

**Goal Types:**
1. Task-based:
   - Multiple check-in tasks: Sum check-in counts
   - Progress tasks: Sum values
   - Can aggregate from tasks across different routines
   
2. Routine-based:
   - Calculate completion % (completed tasks / total tasks)
   - Can aggregate from multiple routines
   
3. Mixed:
   - Combine both tasks and routines in same goal
   - Example: Goal = 80% routine completion + 10000 steps

**Goal Display:**
- Task shows: Own aggregation + all linked goal progress bars
- Routine shows: Completion % + all linked goal progress bars
- Progress bar per goal (multiple if task linked to multiple goals)
- "Link to Goal" button on every task and routine
- Goal achievement celebration (simple toast, non-pressure)

**Tier Limits:**
- Free: 3 goals per person, 3 tasks/routines per goal
- Bronze: 5 goals, 5 items per goal
- Gold: 10 goals, 10 items per goal
- Pro: 20 goals, 20 items per goal

SMART ROUTINE REQUIREMENTS:

**Smart Routine:**
- One-way upgrade from regular routine
- Contains both regular tasks AND smart tasks
- Has conditions that control smart task visibility
- Cannot downgrade back to regular

**Condition System:**
- Belongs to smart routine
- Controls visibility of one or more smart tasks
- Reads current state of:
  - Tasks (same routine or different routines)
  - Routines (completion %)
  - Goals (progress %, achievement status)
- Logic: AND or OR (applies to all condition rows)

**Condition Operators:**
Task (simple): is complete, is not complete
Task (multiple check-in): count >, <, >=, <=, =
Task (progress): value >, <, >=, <=, =
Routine: completion % >, <, >=, <=, =
Goal: progress % >, <, >=, <=, =, is achieved

**Condition Evaluation:**
- Triggered when dependent task/routine/goal changes
- Only evaluates affected conditions (performance)
- Updates smart task visibility immediately
- Caches evaluation results (invalidate on changes)

**Circular Dependency Prevention:**
- Smart task A cannot depend on Smart task B if B depends on A (direct or indirect)
- Build dependency graph on condition save
- Detect cycles using Depth-First Search (DFS)
- Block condition save if cycle detected
- Show error with cycle path

**Visual Condition Builder:**
Row format:
[Dropdown: Select Task/Routine/Goal] [Dropdown: Operator] [Input: Value if needed]

Multiple rows connected with AND/OR radio buttons
"+ Add Condition" button
"×" remove button per row (except first)

TASK DELETION WARNING SYSTEM:

When deleting task that is:
- Linked to goals
- Referenced in conditions
- Both

Show warning modal:
- List all goals affected (mark if will continue or be deleted)
- List all conditions affected (mark if will continue or be deleted)
- If goal/condition has only this task: WILL BE DELETED (show warning icon)
- If goal/condition has other tasks: Will continue (show check icon)
- User options: Cancel or Delete Task + Dependencies

FILE STRUCTURE TO CREATE:
/lib/trpc/routers
  /goal.ts (CRUD, link tasks/routines, progress calculation)
  /condition.ts (CRUD, evaluation)
  /smart-routine.ts (upgrade routine, manage conditions)
  
/lib/services
  /goal-progress.ts (calculate progress for all goal types)
  /condition-eval.ts (evaluate conditions, update smart task visibility)
  /dependency-graph.ts (detect circular dependencies)
  /task-dependencies.ts (check goal/condition links before delete)
  
/components/goal
  /goal-list.tsx
  /goal-form.tsx
  /goal-progress-bar.tsx (single goal)
  /goal-progress-bars.tsx (multiple goals on task)
  /link-to-goal-button.tsx (on tasks/routines)
  /link-goal-dialog.tsx (checkbox list of goals)
  
/components/smart-routine
  /upgrade-to-smart-button.tsx
  /condition-builder.tsx (visual builder)
  /condition-list.tsx
  /smart-task-indicator.tsx
  
/components/task
  /task-deletion-warning.tsx (modal with dependencies)

CODING RULES:
- TypeScript strict mode
- tRPC for all APIs
- Zod validation
- React Query with cache invalidation
- Optimistic updates for goal progress
- Real-time updates via Supabase Realtime for condition evaluation
- Performance: Index all foreign keys
- Performance: Cache condition evaluation results
- Performance: Batch goal progress calculations
- Max 200 lines per file

ALGORITHM: Goal Progress Calculation

```typescript
function calculateGoalProgress(goal: Goal): {
  current: number
  target: number
  percentage: number
  achieved: boolean
} {
  const periodStart = getGoalPeriodStart(goal.period, goal.resetDay)
  let current = 0
  
  // Aggregate from linked tasks
  for (const taskLink of goal.taskLinks) {
    const completions = getCompletionsInPeriod(
      taskLink.task,
      periodStart
    )
    
    if (taskLink.task.type === 'MULTIPLE_CHECKIN') {
      current += completions.length
    } else if (taskLink.task.type === 'PROGRESS') {
      current += completions.reduce((sum, c) => sum + Number(c.value), 0)
    }
  }
  
  // Aggregate from linked routines
  for (const routineLink of goal.routineLinks) {
    const completionPercent = getRoutineCompletionPercent(
      routineLink.routine,
      periodStart
    )
    current += completionPercent
  }
  
  const target = Number(goal.targetValue)
  const percentage = Math.min(100, (current / target) * 100)
  const achieved = current >= target
  
  return { current, target, percentage, achieved }
}
```

ALGORITHM: Condition Evaluation

```typescript
function evaluateCondition(condition: Condition): boolean {
  const results = condition.references.map(ref => {
    switch (ref.referenceType) {
      case 'task':
        return evaluateTaskCondition(ref)
      case 'routine':
        return evaluateRoutineCondition(ref)
      case 'goal':
        return evaluateGoalCondition(ref)
    }
  })
  
  if (condition.logic === 'AND') {
    return results.every(r => r === true)
  } else {
    return results.some(r => r === true)
  }
}

function evaluateTaskCondition(ref: ConditionReference): boolean {
  const task = ref.task
  const latestCompletion = getLatestCompletion(task)
  const value = Number(ref.value || 0)
  
  switch (ref.operator) {
    case 'COMPLETE':
      return latestCompletion !== null
    case 'COUNT_GT':
      return getCompletionCount(task) > value
    case 'VALUE_GTE':
      return Number(latestCompletion?.value || 0) >= value
    // ... other operators
  }
}
```

ALGORITHM: Circular Dependency Detection

```typescript
function detectCircularDependency(
  smartTaskId: string,
  newConditionReferences: { taskId?: string }[]
): { hasCycle: boolean; cyclePath?: string[] } {
  const graph = buildDependencyGraph()
  
  // Add new dependencies
  const deps = new Set<string>()
  for (const ref of newConditionReferences) {
    if (ref.taskId) deps.add(ref.taskId)
  }
  graph.set(smartTaskId, deps)
  
  // DFS to detect cycle
  const visited = new Set<string>()
  const recStack = new Set<string>()
  const path: string[] = []
  
  function dfs(taskId: string): boolean {
    visited.add(taskId)
    recStack.add(taskId)
    path.push(taskId)
    
    const dependencies = graph.get(taskId) || new Set()
    for (const depId of dependencies) {
      if (!visited.has(depId)) {
        if (dfs(depId)) return true
      } else if (recStack.has(depId)) {
        path.push(depId)
        return true
      }
    }
    
    recStack.delete(taskId)
    path.pop()
    return false
  }
  
  const hasCycle = dfs(smartTaskId)
  return { hasCycle, cyclePath: hasCycle ? path : undefined }
}
```

TESTING REQUIREMENTS:
- Goal progress calculation tests (all types)
- Goal reset tests (daily/weekly/monthly)
- Cross-routine aggregation tests
- Condition evaluation tests (all operators)
- Circular dependency detection tests
- Smart task visibility tests
- Task deletion warning tests

BEGIN IMPLEMENTATION:
Day 1: Goal system (CRUD, linking, progress calculation)
Day 2: Goal display (progress bars, "Link to Goal" button)
Day 3: Smart routines (upgrade, conditions, visual builder)
Day 4: Condition evaluation, circular dependency, task deletion warnings

Start with Goal system first (foundation).
Test goal progress calculation thoroughly before moving to conditions.
Implement circular dependency detection before allowing condition saves.
```

---

## 📦 Complete Implementation

### Day 1: Goal System

**Goal tRPC Router** (`/lib/trpc/routers/goal.ts`):
```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../init'
import { GoalPeriod, GoalStatus } from '@prisma/client'
import { calculateGoalProgress } from '@/lib/services/goal-progress'
import { checkTierLimit } from '@/lib/services/tier-limits'

export const goalRouter = router({
  list: protectedProcedure
    .input(z.object({ personId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const goals = await ctx.prisma.goal.findMany({
        where: {
          personId: input.personId,
          status: GoalStatus.ACTIVE
        },
        include: {
          taskLinks: { include: { task: true } },
          routineLinks: { include: { routine: true } }
        }
      })
      
      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async goal => ({
          ...goal,
          progress: await calculateGoalProgress(goal.id)
        }))
      )
      
      return goalsWithProgress
    }),

  create: protectedProcedure
    .input(z.object({
      personId: z.string().cuid(),
      name: z.string().min(1).max(100),
      targetValue: z.number().positive(),
      period: z.nativeEnum(GoalPeriod),
      resetDay: z.number().min(0).max(99).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check tier limit
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.personId },
        include: { 
          role: true,
          goals: { where: { status: 'ACTIVE' } }
        }
      })
      
      await checkTierLimit(
        person!.role.tier,
        'goals_per_person',
        person!.goals.length
      )
      
      const goal = await ctx.prisma.goal.create({
        data: input
      })
      
      return goal
    }),

  linkTasks: protectedProcedure
    .input(z.object({
      goalId: z.string().cuid(),
      taskIds: z.array(z.string().cuid())
    }))
    .mutation(async ({ ctx, input }) => {
      // Check tier limit for items per goal
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
        include: {
          person: { include: { role: true } },
          taskLinks: true,
          routineLinks: true
        }
      })
      
      const totalItems = goal!.taskLinks.length + goal!.routineLinks.length + input.taskIds.length
      
      await checkTierLimit(
        goal!.person.role.tier,
        'items_per_goal',
        totalItems
      )
      
      // Create links
      await ctx.prisma.goalTaskLink.createMany({
        data: input.taskIds.map(taskId => ({
          goalId: input.goalId,
          taskId
        })),
        skipDuplicates: true
      })
      
      return { success: true }
    }),

  linkRoutines: protectedProcedure
    .input(z.object({
      goalId: z.string().cuid(),
      routineIds: z.array(z.string().cuid())
    }))
    .mutation(async ({ ctx, input }) => {
      // Similar to linkTasks, check limits then create
      await ctx.prisma.goalRoutineLink.createMany({
        data: input.routineIds.map(routineId => ({
          goalId: input.goalId,
          routineId
        })),
        skipDuplicates: true
      })
      
      return { success: true }
    }),

  unlinkTask: protectedProcedure
    .input(z.object({
      goalId: z.string().cuid(),
      taskId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if this is the only task in goal
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
        include: {
          taskLinks: true,
          routineLinks: true
        }
      })
      
      const totalItems = goal!.taskLinks.length + goal!.routineLinks.length
      
      if (totalItems === 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove last item from goal. Delete goal instead.'
        })
      }
      
      await ctx.prisma.goalTaskLink.delete({
        where: {
          goalId_taskId: {
            goalId: input.goalId,
            taskId: input.taskId
          }
        }
      })
      
      return { success: true }
    })
})
```

**Goal Progress Calculator** (`/lib/services/goal-progress.ts`):
```typescript
import { prisma } from '@/lib/prisma'
import { GoalPeriod } from '@prisma/client'

export async function calculateGoalProgress(goalId: string) {
  const goal = await prisma.goal.findUniqueOrThrow({
    where: { id: goalId },
    include: {
      taskLinks: {
        include: {
          task: {
            include: { completions: true }
          }
        }
      },
      routineLinks: {
        include: {
          routine: {
            include: {
              tasks: {
                include: { completions: true }
              }
            }
          }
        }
      }
    }
  })
  
  const periodStart = getGoalPeriodStart(goal.period, goal.resetDay)
  let current = 0
  
  // Aggregate from tasks
  for (const taskLink of goal.taskLinks) {
    const completions = taskLink.task.completions.filter(
      c => c.completedAt >= periodStart
    )
    
    if (taskLink.task.type === 'MULTIPLE_CHECKIN') {
      current += completions.length
    } else if (taskLink.task.type === 'PROGRESS') {
      current += completions.reduce((sum, c) => sum + Number(c.value || 0), 0)
    }
  }
  
  // Aggregate from routines
  for (const routineLink of goal.routineLinks) {
    const totalTasks = routineLink.routine.tasks.length
    if (totalTasks === 0) continue
    
    const completedTasks = routineLink.routine.tasks.filter(task => {
      return task.completions.some(c => c.completedAt >= periodStart)
    }).length
    
    const completionPercent = (completedTasks / totalTasks) * 100
    current += completionPercent
  }
  
  const target = Number(goal.targetValue)
  const percentage = Math.min(100, (current / target) * 100)
  const achieved = current >= target
  
  return { current, target, percentage, achieved }
}

function getGoalPeriodStart(period: GoalPeriod, resetDay?: number | null): Date {
  const now = new Date()
  
  switch (period) {
    case 'DAILY':
      const today = new Date(now)
      today.setHours(23, 55, 0, 0)
      if (now < today) {
        today.setDate(today.getDate() - 1)
      }
      return today
      
    case 'WEEKLY':
      // Calculate last reset day at 11:55 PM
      const targetDay = resetDay ?? 0
      const daysAgo = (now.getDay() - targetDay + 7) % 7
      const lastReset = new Date(now)
      lastReset.setDate(lastReset.getDate() - daysAgo)
      lastReset.setHours(23, 55, 0, 0)
      return lastReset
      
    case 'MONTHLY':
      // Calculate last reset day at 11:55 PM
      const day = resetDay === 99 ? 0 : resetDay // 99 = last day
      const lastMonthReset = new Date(now)
      if (day === 0) {
        lastMonthReset.setMonth(lastMonthReset.getMonth(), 0) // Last day of prev month
      } else {
        lastMonthReset.setDate(day)
      }
      lastMonthReset.setHours(23, 55, 0, 0)
      return lastMonthReset
      
    default:
      return now
  }
}
```

Continue with Days 2-4...

---

## ✅ Stage 3 Complete When:

```
□ Can create/edit/delete goals
□ Can link tasks to goals
□ Can link routines to goals
□ Goal progress calculates correctly (all types)
□ Goal achievement tracking works
□ "Link to Goal" button on tasks/routines
□ Multiple progress bars display on tasks
□ Can upgrade routine to smart
□ Can create conditions (visual builder)
□ Condition evaluation works (all operators)
□ Smart task visibility updates in real-time
□ Cross-routine conditions work
□ Circular dependency detection works
□ Task deletion warnings show dependencies
□ All tests passing
```

**Next:** [Stage 4: Kiosk Mode](STAGE-4-COMPLETE.md)
