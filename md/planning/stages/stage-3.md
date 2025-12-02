# Stage 3: Goals & Smart Routines

**Duration:** 3-4 days  
**Token Estimate:** 80K tokens ($1.20)  
**Prerequisites:** Stage 2 completed (core CRUD working)

---

## SESSION PROMPT (Copy-Paste This)

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

CURRENT STAGE OBJECTIVES:
1. Goal system (task-based + routine-based aggregation)
2. Goal progress calculation (real-time)
3. Goal achievement tracking
4. Goal linking UI ("Link to Goal" button on tasks)
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
- Period: Daily, Weekly, Monthly (independent of task periods)
- Target value (numeric)
- Links to multiple tasks OR multiple routines OR both
- Reset configuration (same as routines)

**Goal Types:**
1. Task-based goals: Aggregate from multiple check-in/progress tasks
2. Routine-based goals: Track completion percentage
3. Mixed goals: Combine tasks and routines

**Goal Progress Calculation:**
- Daily goals: Track since last 11:55 PM
- Weekly goals: Rolling 7-day window OR since last weekly reset
- Monthly goals: Rolling 30-day window OR since last monthly reset
- Real-time updates as tasks completed

SMART ROUTINE REQUIREMENTS:

**Smart Routine:**
- Upgrade from regular routine (one-way conversion)
- Contains regular tasks AND smart tasks
- Has conditions that control smart task visibility

**Condition System:**
- Belongs to smart routine
- Controls one or more smart tasks
- Reads current state of tasks, routines, goals
- Logic: AND or OR
- Operators: complete, count, value, completion %, progress %, achieved

**Circular Dependency Prevention:**
- Smart task A cannot depend on Smart task B if B depends on A
- Build dependency graph on condition save
- Detect cycles using DFS
- Block condition save if cycle detected

**Visual Condition Builder:**
```
Show [Smart Task Name] when:

[Dropdown: Task/Routine/Goal] [Dropdown: Operator] [Input: Value]

AND / OR (radio buttons)

[Dropdown: Task/Routine/Goal] [Dropdown: Operator] [Input: Value]

+ Add Condition
```

TASK DELETION WARNING SYSTEM:

When deleting task that is linked to goals or referenced in conditions,
show warning modal with impact analysis.

TESTING REQUIREMENTS:
- Goal progress calculation tests (all types)
- Goal reset tests (daily/weekly/monthly)
- Cross-routine aggregation tests
- Condition evaluation tests (all operators)
- Circular dependency detection tests
- Smart task visibility tests
- Task deletion warning tests

BEGIN IMPLEMENTATION:
Start with Goal system, then Smart Routines, then Conditions.
Implement goal progress calculation first (foundation for everything).
Test thoroughly before moving to conditions (complex logic).
```

---

## Deliverables Checklist

```
GOAL SYSTEM:
□ Goal CRUD operations
□ Goal-task linking
□ Goal-routine linking
□ Goal progress calculation (all types)
□ Goal achievement tracking
□ "Link to Goal" button UI
□ Goal progress bars (multiple per task)

SMART ROUTINES:
□ Upgrade routine to smart
□ Smart routine indicator UI

CONDITION SYSTEM:
□ Condition CRUD operations
□ Visual condition builder UI
□ Condition evaluation engine
□ Smart task visibility control
□ Cross-routine condition support
□ Circular dependency detection

TASK DELETION WARNING:
□ Detect dependencies
□ Warning modal UI
□ Delete task + dependencies action
```

---

## Next Stage

After completing Stage 3, proceed to:
**[Stage 4: Kiosk Mode](stage-4.md)**
