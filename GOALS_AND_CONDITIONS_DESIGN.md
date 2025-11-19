# Goals and Conditions System Design for Ruby Routines

## Executive Summary

This document outlines a comprehensive design for enhancing the Goals and Conditions system in Ruby Routines. The system will provide advanced achievement tracking, smart routine visibility, and conditional task management capabilities for both parents and teachers.

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [API Design](#2-api-design)
3. [Business Logic](#3-business-logic)
4. [UI/UX Approach](#4-uiux-approach)
5. [Implementation Phases](#5-implementation-phases)
6. [Integration Points](#6-integration-points)

---

## 1. Database Schema

### 1.1 Enhanced Goal Models

```prisma
// Enhanced Goal model with new features
model Goal {
  id                      String       @id @default(uuid())
  roleId                  String
  name                    String
  description             String?

  // Goal Configuration
  type                    GoalType     @default(COMPLETION_COUNT)
  category                GoalCategory @default(CUSTOM)
  target                  Float
  unit                    String?      // e.g., "tasks", "minutes", "books"
  period                  ResetPeriod  @default(WEEKLY)
  resetDay                Int?

  // Goal Scope
  scope                   GoalScope    @default(INDIVIDUAL)
  personIds               String[]     @default([])
  groupIds                String[]     @default([])

  // Visual & Rewards
  icon                    String?      // Icon identifier
  color                   String?      // Hex color
  badgeType               BadgeType?   // Type of badge to award
  rewardMessage           String?      // Custom celebration message

  // Progress Tracking
  streakEnabled           Boolean      @default(false)
  currentStreak           Int          @default(0)
  longestStreak           Int          @default(0)
  lastAchievedAt          DateTime?

  // Metadata
  isSystemGoal            Boolean      @default(false) // Pre-defined system goals
  status                  EntityStatus @default(ACTIVE)
  archivedAt              DateTime?
  sourceMarketplaceItemId String?
  createdAt               DateTime     @default(now())
  updatedAt               DateTime     @updatedAt

  // Relations
  role                  Role              @relation(fields: [roleId], references: [id], onDelete: Cascade)
  taskLinks             GoalTaskLink[]
  routineLinks          GoalRoutineLink[]
  achievements          GoalAchievement[]
  milestones            GoalMilestone[]
  targetConditionChecks ConditionCheck[]  @relation("TargetGoalConditionChecks")
  notifications         GoalNotification[]

  @@index([roleId, status])
  @@index([roleId, type])
  @@index([roleId, scope])
  @@map("goals")
}

enum GoalType {
  COMPLETION_COUNT     // Count of task/routine completions
  STREAK              // Consecutive days/weeks/months
  TIME_BASED          // Total time spent (for PROGRESS tasks)
  VALUE_BASED         // Sum of values (for PROGRESS tasks)
  PERCENTAGE          // % of routines completed
  CUSTOM_METRIC       // Custom calculation logic
}

enum GoalCategory {
  EDUCATION
  HEALTH
  CHORES
  BEHAVIOR
  SOCIAL
  CREATIVE
  CUSTOM
}

enum GoalScope {
  INDIVIDUAL          // Each person has their own progress
  GROUP              // Group members contribute to shared goal
  ROLE               // All persons in role contribute
}

enum BadgeType {
  STAR
  TROPHY
  MEDAL
  RIBBON
  CERTIFICATE
  CUSTOM
}

// Track goal achievements
model GoalAchievement {
  id          String   @id @default(uuid())
  goalId      String
  personId    String
  achievedAt  DateTime @default(now())
  value       Float    // The value at achievement time
  periodStart DateTime // Period when achieved
  periodEnd   DateTime
  badgeAwarded BadgeType?

  // Relations
  goal   Goal   @relation(fields: [goalId], references: [id], onDelete: Cascade)
  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([goalId, personId, periodStart]) // One achievement per person per period
  @@index([goalId, personId])
  @@index([achievedAt])
  @@map("goal_achievements")
}

// Define milestones within goals
model GoalMilestone {
  id            String    @id @default(uuid())
  goalId        String
  name          String
  value         Float     // Target value for this milestone
  rewardMessage String?
  badgeType     BadgeType?
  achievedBy    String[]  @default([]) // Person IDs who achieved this
  createdAt     DateTime  @default(now())

  // Relations
  goal Goal @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@index([goalId])
  @@map("goal_milestones")
}

// Goal-specific notifications
model GoalNotification {
  id           String           @id @default(uuid())
  goalId       String
  type         NotificationType
  enabled      Boolean          @default(true)
  recipients   String[]         @default([]) // User IDs to notify
  lastSentAt   DateTime?
  createdAt    DateTime         @default(now())

  // Relations
  goal Goal @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@unique([goalId, type])
  @@index([goalId])
  @@map("goal_notifications")
}

enum NotificationType {
  PROGRESS_UPDATE     // Daily/weekly progress updates
  ACHIEVEMENT        // When goal is achieved
  MILESTONE          // When milestone is reached
  STREAK_RISK        // When streak is at risk
  ENCOURAGEMENT      // Motivational messages
}
```

### 1.2 Enhanced Condition Models

```prisma
// Enhanced Condition model
model Condition {
  id              String         @id @default(cuid())
  routineId       String?        // Optional: can be standalone
  name            String?        // Optional name for complex conditions
  description     String?        // Help text explaining the condition
  controlsRoutine Boolean        @default(false)
  logic           ConditionLogic @default(AND)

  // Condition Template
  isTemplate      Boolean        @default(false) // Reusable condition template
  templateName    String?        // Name for template
  roleId          String?        // Role that owns this template

  // Metadata
  lastEvaluatedAt DateTime?
  evaluationCache Json?          // Cache evaluation results
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  routine         Routine?          @relation("RoutineConditions", fields: [routineId], references: [id], onDelete: Cascade)
  role            Role?             @relation(fields: [roleId], references: [id], onDelete: Cascade)
  controlledTasks Task[]
  checks          ConditionCheck[]
  triggers        ConditionTrigger[]

  @@index([routineId])
  @@index([controlsRoutine])
  @@index([isTemplate, roleId])
  @@map("conditions")
}

// Enhanced condition checks with more operators
model ConditionCheck {
  id              String            @id @default(cuid())
  conditionId     String
  negate          Boolean           @default(false)
  operator        ConditionOperator
  value           String?
  value2          String?           // For range operators

  // Targets
  targetTaskId    String?
  targetRoutineId String?
  targetGoalId    String?

  // Context-based conditions
  contextType     ContextType?
  contextValue    String?           // JSON for complex context data

  // Time-based conditions
  timeOperator    TimeOperator?
  timeValue       String?           // Time in HH:MM format
  dayOfWeek       Int[]            @default([]) // 0-6 for specific days

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  condition      Condition @relation(fields: [conditionId], references: [id], onDelete: Cascade)
  targetTask     Task?     @relation("TargetTaskConditionChecks", fields: [targetTaskId], references: [id], onDelete: Cascade)
  targetRoutine  Routine?  @relation("TargetRoutineConditionChecks", fields: [targetRoutineId], references: [id], onDelete: Cascade)
  targetGoal     Goal?     @relation("TargetGoalConditionChecks", fields: [targetGoalId], references: [id], onDelete: Cascade)

  @@index([conditionId])
  @@index([targetTaskId])
  @@index([targetRoutineId])
  @@index([targetGoalId])
  @@index([contextType])
  @@map("condition_checks")
}

enum ConditionOperator {
  // Task operators
  TASK_COMPLETED
  TASK_NOT_COMPLETED
  TASK_COUNT_EQUALS
  TASK_COUNT_GT
  TASK_COUNT_LT
  TASK_COUNT_BETWEEN      // New: range check
  TASK_VALUE_EQUALS
  TASK_VALUE_GT
  TASK_VALUE_LT
  TASK_VALUE_BETWEEN      // New: range check
  TASK_STREAK_GT          // New: streak check
  TASK_STREAK_LT

  // Routine operators
  ROUTINE_PERCENT_EQUALS
  ROUTINE_PERCENT_GT
  ROUTINE_PERCENT_LT
  ROUTINE_PERCENT_BETWEEN // New: range check
  ROUTINE_COMPLETED       // New: 100% complete
  ROUTINE_STARTED         // New: >0% complete

  // Goal operators
  GOAL_ACHIEVED
  GOAL_NOT_ACHIEVED
  GOAL_PROGRESS_GT        // New: progress check
  GOAL_PROGRESS_LT
  GOAL_MILESTONE_REACHED  // New: specific milestone

  // Context operators
  CONTEXT_EQUALS          // New: context-based
  CONTEXT_CONTAINS        // New: context contains value
  CONTEXT_MATCH           // New: regex match
}

enum ContextType {
  TIME_OF_DAY            // Current time
  DAY_OF_WEEK           // Current day
  DATE_RANGE            // Date range check
  LOCATION              // GPS or zone-based
  WEATHER               // Weather conditions
  ATTENDANCE            // Classroom attendance
  DEVICE                // Device type/OS
  CUSTOM                // Custom context data
}

enum TimeOperator {
  BEFORE
  AFTER
  BETWEEN
  EXACTLY
}

// Track condition evaluations for optimization
model ConditionTrigger {
  id            String   @id @default(uuid())
  conditionId   String
  personId      String
  triggered     Boolean
  evaluatedAt   DateTime @default(now())
  triggerReason String?  // What caused the evaluation

  // Relations
  condition Condition @relation(fields: [conditionId], references: [id], onDelete: Cascade)
  person    Person    @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([conditionId, personId])
  @@index([evaluatedAt])
  @@map("condition_triggers")
}
```

### 1.3 Additional Support Models

```prisma
// Pre-defined goal templates
model GoalTemplate {
  id          String       @id @default(uuid())
  name        String
  description String
  type        GoalType
  category    GoalCategory
  targetAudience String    // PARENT, TEACHER, BOTH
  ageGroup    String?     // e.g., "3-5", "6-8", "9-12"

  // Default configuration
  defaultTarget Float
  defaultPeriod ResetPeriod
  defaultUnit   String?

  // Template content
  templateData Json        // Full goal configuration

  isSystemTemplate Boolean  @default(true)
  createdAt    DateTime    @default(now())

  @@index([targetAudience])
  @@index([category])
  @@map("goal_templates")
}

// Condition recipes for common scenarios
model ConditionRecipe {
  id          String   @id @default(uuid())
  name        String
  description String
  category    String   // e.g., "Time-based", "Sequence", "Achievement"
  targetAudience String // PARENT, TEACHER, BOTH

  // Recipe configuration
  recipeData  Json     // Condition checks configuration

  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([category])
  @@index([targetAudience])
  @@map("condition_recipes")
}
```

---

## 2. API Design

### 2.1 Enhanced Goal Router

```typescript
// lib/trpc/routers/goal.ts - Enhanced endpoints

export const goalRouter = router({
  // Existing endpoints (enhanced)
  list: // Enhanced with filters, pagination, and batch progress
  getById: // Enhanced with detailed progress and achievements
  create: // Enhanced with template support
  update: // Enhanced with milestone management
  archive: // Soft delete with cleanup

  // New endpoints

  // Progress tracking
  getProgress: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      personId: z.string().cuid().optional(),
      groupId: z.string().cuid().optional(),
      dateRange: z.object({
        start: z.date(),
        end: z.date()
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Return detailed progress with history
    }),

  // Achievements
  getAchievements: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      personId: z.string().cuid().optional(),
      limit: z.number().default(10)
    }))
    .query(async ({ ctx, input }) => {
      // Return recent achievements with badges
    }),

  // Milestones
  createMilestone: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      name: z.string(),
      value: z.number(),
      rewardMessage: z.string().optional(),
      badgeType: z.enum(['STAR', 'TROPHY', 'MEDAL', 'RIBBON', 'CERTIFICATE']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Create milestone for goal
    }),

  // Templates
  getTemplates: protectedProcedure
    .input(z.object({
      roleType: z.enum(['PARENT', 'TEACHER']),
      category: z.enum(['EDUCATION', 'HEALTH', 'CHORES', 'BEHAVIOR', 'SOCIAL', 'CREATIVE']).optional(),
      ageGroup: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Return applicable goal templates
    }),

  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      roleId: z.string().uuid(),
      personIds: z.array(z.string().cuid()).optional(),
      groupIds: z.array(z.string().cuid()).optional(),
      customizations: z.object({
        name: z.string().optional(),
        target: z.number().optional(),
        period: z.nativeEnum(ResetPeriod).optional()
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Create goal from template with customizations
    }),

  // Streaks
  getStreaks: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      personId: z.string().cuid().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Return current streaks and risk assessment
    }),

  // Notifications
  configureNotifications: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      notifications: z.array(z.object({
        type: z.enum(['PROGRESS_UPDATE', 'ACHIEVEMENT', 'MILESTONE', 'STREAK_RISK', 'ENCOURAGEMENT']),
        enabled: z.boolean(),
        recipients: z.array(z.string()).optional()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      // Configure goal notifications
    }),

  // Batch operations
  batchCreate: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      goals: z.array(goalCreateSchema)
    }))
    .mutation(async ({ ctx, input }) => {
      // Create multiple goals at once
    }),

  // Analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      period: z.enum(['WEEK', 'MONTH', 'QUARTER', 'YEAR']),
      personId: z.string().cuid().optional(),
      groupId: z.string().cuid().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Return goal analytics and insights
    })
});
```

### 2.2 Enhanced Condition Router

```typescript
// lib/trpc/routers/condition.ts - Enhanced endpoints

export const conditionRouter = router({
  // Existing endpoints (enhanced)
  create: // Enhanced with templates and validation
  update: // Enhanced with cascade updates
  delete: // Enhanced with dependency checking
  evaluate: // Enhanced with caching and batch evaluation

  // New endpoints

  // Templates
  getTemplates: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      category: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Return condition templates for role
    }),

  saveAsTemplate: protectedProcedure
    .input(z.object({
      conditionId: z.string().cuid(),
      templateName: z.string(),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Save condition as reusable template
    }),

  // Recipes
  getRecipes: protectedProcedure
    .input(z.object({
      roleType: z.enum(['PARENT', 'TEACHER']),
      category: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Return condition recipes
    }),

  applyRecipe: protectedProcedure
    .input(z.object({
      recipeId: z.string().uuid(),
      routineId: z.string().cuid(),
      customizations: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Apply recipe to routine
    }),

  // Batch evaluation
  evaluateBatch: protectedProcedure
    .input(z.object({
      routineIds: z.array(z.string().cuid()),
      personId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      // Evaluate multiple routine conditions at once
    }),

  // Context conditions
  evaluateContext: protectedProcedure
    .input(z.object({
      conditionId: z.string().cuid(),
      context: z.object({
        time: z.string().optional(),
        location: z.object({
          lat: z.number(),
          lng: z.number()
        }).optional(),
        weather: z.object({
          condition: z.string(),
          temperature: z.number()
        }).optional(),
        custom: z.record(z.any()).optional()
      })
    }))
    .query(async ({ ctx, input }) => {
      // Evaluate condition with context
    }),

  // Validation
  validate: protectedProcedure
    .input(z.object({
      routineId: z.string().cuid(),
      checks: z.array(conditionCheckSchema)
    }))
    .query(async ({ ctx, input }) => {
      // Validate condition configuration
      // Check for circular dependencies, conflicts, etc.
    }),

  // Analytics
  getTriggerHistory: protectedProcedure
    .input(z.object({
      conditionId: z.string().cuid(),
      personId: z.string().cuid().optional(),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      // Return condition trigger history
    }),

  // Optimization
  optimizationSuggestions: protectedProcedure
    .input(z.object({
      routineId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      // Suggest condition optimizations
    })
});
```

---

## 3. Business Logic

### 3.1 Goal Evaluation Logic

```typescript
// lib/services/goal/goal-evaluator.service.ts

export class GoalEvaluator {
  /**
   * Core evaluation logic for different goal types
   */
  async evaluateGoal(
    goalId: string,
    personId: string,
    context?: EvaluationContext
  ): Promise<GoalEvaluation> {
    const goal = await this.getGoalWithData(goalId);
    const periodBounds = this.getPeriodBounds(goal.period, goal.resetDay);

    let evaluation: GoalEvaluation;

    switch (goal.type) {
      case GoalType.COMPLETION_COUNT:
        evaluation = await this.evaluateCompletionCount(goal, personId, periodBounds);
        break;

      case GoalType.STREAK:
        evaluation = await this.evaluateStreak(goal, personId, periodBounds);
        break;

      case GoalType.TIME_BASED:
        evaluation = await this.evaluateTimeBased(goal, personId, periodBounds);
        break;

      case GoalType.VALUE_BASED:
        evaluation = await this.evaluateValueBased(goal, personId, periodBounds);
        break;

      case GoalType.PERCENTAGE:
        evaluation = await this.evaluatePercentage(goal, personId, periodBounds);
        break;

      case GoalType.CUSTOM_METRIC:
        evaluation = await this.evaluateCustomMetric(goal, personId, periodBounds, context);
        break;
    }

    // Check for achievements and milestones
    await this.checkAchievements(goal, personId, evaluation);
    await this.checkMilestones(goal, personId, evaluation);

    // Update streak if applicable
    if (goal.streakEnabled) {
      await this.updateStreak(goal, personId, evaluation);
    }

    // Trigger notifications if needed
    await this.triggerNotifications(goal, personId, evaluation);

    return evaluation;
  }

  /**
   * Batch evaluation for performance
   */
  async evaluateBatch(
    goalIds: string[],
    personId: string
  ): Promise<Map<string, GoalEvaluation>> {
    // Fetch all goals and related data in one query
    const goals = await this.getGoalsWithDataBatch(goalIds);
    const evaluations = new Map<string, GoalEvaluation>();

    // Process in parallel where possible
    const promises = goals.map(async (goal) => {
      const evaluation = await this.evaluateGoal(goal.id, personId);
      evaluations.set(goal.id, evaluation);
    });

    await Promise.all(promises);
    return evaluations;
  }

  /**
   * Smart caching for frequently evaluated goals
   */
  private async getCachedOrEvaluate(
    goalId: string,
    personId: string,
    maxAge: number = 300000 // 5 minutes
  ): Promise<GoalEvaluation> {
    const cacheKey = `goal:${goalId}:person:${personId}`;
    const cached = await cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.evaluation;
    }

    const evaluation = await this.evaluateGoal(goalId, personId);
    await cache.set(cacheKey, {
      evaluation,
      timestamp: Date.now()
    });

    return evaluation;
  }
}
```

### 3.2 Condition Evaluation Logic

```typescript
// lib/services/condition/condition-evaluator.service.ts

export class ConditionEvaluator {
  /**
   * Enhanced condition evaluation with context support
   */
  async evaluateCondition(
    conditionId: string,
    personId: string,
    context?: EvaluationContext
  ): Promise<ConditionEvaluation> {
    const condition = await this.getConditionWithChecks(conditionId);
    const checks = condition.checks;

    // Evaluate each check
    const checkResults = await Promise.all(
      checks.map(check => this.evaluateCheck(check, personId, context))
    );

    // Apply logical operator
    let result: boolean;
    if (condition.logic === 'AND') {
      result = checkResults.every(r => r.passed);
    } else { // OR
      result = checkResults.some(r => r.passed);
    }

    // Store trigger history for analytics
    await this.recordTrigger(conditionId, personId, result, checkResults);

    return {
      conditionId,
      passed: result,
      checks: checkResults,
      evaluatedAt: new Date(),
      context
    };
  }

  /**
   * Evaluate individual condition check
   */
  private async evaluateCheck(
    check: ConditionCheck,
    personId: string,
    context?: EvaluationContext
  ): Promise<CheckResult> {
    let result: boolean = false;

    // Handle different check types
    if (check.targetTaskId) {
      result = await this.evaluateTaskCheck(check, personId);
    } else if (check.targetRoutineId) {
      result = await this.evaluateRoutineCheck(check, personId);
    } else if (check.targetGoalId) {
      result = await this.evaluateGoalCheck(check, personId);
    } else if (check.contextType) {
      result = await this.evaluateContextCheck(check, context);
    }

    // Apply negation if needed
    if (check.negate) {
      result = !result;
    }

    return {
      checkId: check.id,
      passed: result,
      operator: check.operator,
      actualValue: await this.getActualValue(check, personId, context)
    };
  }

  /**
   * Context-based evaluation (time, location, weather, etc.)
   */
  private async evaluateContextCheck(
    check: ConditionCheck,
    context?: EvaluationContext
  ): Promise<boolean> {
    if (!context) return false;

    switch (check.contextType) {
      case ContextType.TIME_OF_DAY:
        return this.evaluateTimeContext(check, context.time);

      case ContextType.DAY_OF_WEEK:
        return this.evaluateDayOfWeekContext(check, context.dayOfWeek);

      case ContextType.LOCATION:
        return this.evaluateLocationContext(check, context.location);

      case ContextType.WEATHER:
        return this.evaluateWeatherContext(check, context.weather);

      case ContextType.ATTENDANCE:
        return this.evaluateAttendanceContext(check, context.attendance);

      case ContextType.CUSTOM:
        return this.evaluateCustomContext(check, context.custom);

      default:
        return false;
    }
  }

  /**
   * Batch evaluation for multiple routines
   */
  async evaluateRoutineVisibility(
    roleId: string,
    personId: string,
    context?: EvaluationContext
  ): Promise<Map<string, boolean>> {
    // Get all routines with conditional visibility
    const routines = await prisma.routine.findMany({
      where: {
        roleId,
        visibility: 'CONDITIONAL',
        status: 'ACTIVE'
      },
      include: {
        conditions: {
          where: { controlsRoutine: true },
          include: { checks: true }
        }
      }
    });

    const visibility = new Map<string, boolean>();

    // Evaluate in parallel
    const promises = routines.map(async (routine) => {
      if (routine.conditions.length === 0) {
        visibility.set(routine.id, true);
        return;
      }

      // Evaluate all conditions for the routine
      const results = await Promise.all(
        routine.conditions.map(c =>
          this.evaluateCondition(c.id, personId, context)
        )
      );

      // Routine is visible if any condition passes
      const isVisible = results.some(r => r.passed);
      visibility.set(routine.id, isVisible);
    });

    await Promise.all(promises);
    return visibility;
  }
}
```

### 3.3 Performance Optimizations

```typescript
// lib/services/optimization/condition-optimizer.service.ts

export class ConditionOptimizer {
  /**
   * Optimize condition evaluation order for better performance
   */
  optimizeCheckOrder(checks: ConditionCheck[]): ConditionCheck[] {
    // Sort checks by evaluation cost (cheapest first)
    return checks.sort((a, b) => {
      const costA = this.getEvaluationCost(a);
      const costB = this.getEvaluationCost(b);
      return costA - costB;
    });
  }

  /**
   * Get evaluation cost estimate
   */
  private getEvaluationCost(check: ConditionCheck): number {
    // Context checks are cheapest (no DB queries)
    if (check.contextType) return 1;

    // Task checks are moderate (single query)
    if (check.targetTaskId) return 5;

    // Routine checks are expensive (multiple queries)
    if (check.targetRoutineId) return 10;

    // Goal checks are most expensive (complex calculations)
    if (check.targetGoalId) return 20;

    return 100; // Unknown
  }

  /**
   * Cache strategy for condition results
   */
  getCacheStrategy(condition: Condition): CacheStrategy {
    const hasTimeContext = condition.checks.some(
      c => c.contextType === ContextType.TIME_OF_DAY
    );

    const hasVolatileTargets = condition.checks.some(
      c => c.targetTaskId || c.targetRoutineId
    );

    if (hasTimeContext) {
      // Short cache for time-sensitive conditions
      return { ttl: 60000, key: 'time-sensitive' }; // 1 minute
    }

    if (hasVolatileTargets) {
      // Medium cache for task/routine conditions
      return { ttl: 300000, key: 'task-based' }; // 5 minutes
    }

    // Long cache for stable conditions
    return { ttl: 3600000, key: 'stable' }; // 1 hour
  }
}
```

---

## 4. UI/UX Approach

### 4.1 Component Architecture

```typescript
// Component structure for Goals

components/
  goals/
    GoalDashboard.tsx         // Main goals view with progress
    GoalCard.tsx              // Individual goal display
    GoalProgressRing.tsx      // Circular progress indicator
    GoalForm.tsx              // Create/edit goal
    GoalTemplateGallery.tsx   // Browse goal templates
    GoalAchievementBadge.tsx  // Achievement display
    GoalMilestoneTracker.tsx  // Milestone progress
    GoalStreakIndicator.tsx   // Streak visualization
    GoalAnalytics.tsx         // Goal analytics charts

  conditions/
    ConditionBuilder.tsx      // Visual condition builder
    ConditionCheck.tsx        // Individual check component
    ConditionRecipeCard.tsx   // Recipe selection
    ConditionTemplate.tsx     // Template management
    ConditionValidator.tsx    // Real-time validation
    ConditionSimulator.tsx    // Test conditions
    ConditionTimeline.tsx     // Trigger history view

  shared/
    ProgressBar.tsx           // Reusable progress bar
    AchievementModal.tsx      // Celebration modal
    NotificationSettings.tsx  // Configure notifications
```

### 4.2 User Flows

#### Goal Creation Flow

```typescript
// components/goals/GoalCreationWizard.tsx

export function GoalCreationWizard() {
  const steps = [
    {
      id: 'type',
      title: 'Choose Goal Type',
      component: <GoalTypeSelector />,
      description: 'What do you want to track?'
    },
    {
      id: 'template',
      title: 'Select Template',
      component: <GoalTemplateGallery />,
      description: 'Start with a template or create custom'
    },
    {
      id: 'configure',
      title: 'Configure Goal',
      component: <GoalConfiguration />,
      description: 'Set targets and periods'
    },
    {
      id: 'assign',
      title: 'Assign to People',
      component: <GoalAssignment />,
      description: 'Who is this goal for?'
    },
    {
      id: 'link',
      title: 'Link Items',
      component: <GoalLinking />,
      description: 'Connect tasks and routines'
    },
    {
      id: 'rewards',
      title: 'Set Rewards',
      component: <GoalRewards />,
      description: 'Configure badges and celebrations'
    }
  ];

  return <MultiStepWizard steps={steps} />;
}
```

#### Condition Builder Interface

```typescript
// components/conditions/VisualConditionBuilder.tsx

export function VisualConditionBuilder() {
  return (
    <div className="condition-builder">
      <ConditionLogicSelector /> {/* AND/OR toggle */}

      <div className="checks-container">
        {checks.map(check => (
          <ConditionCheckCard
            key={check.id}
            check={check}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}

        <AddCheckButton onClick={addNewCheck} />
      </div>

      <ConditionPreview /> {/* Live preview */}
      <ConditionValidator /> {/* Real-time validation */}

      <div className="recipe-suggestions">
        <h3>Suggested Recipes</h3>
        <RecipeSuggestions context={currentContext} />
      </div>
    </div>
  );
}
```

### 4.3 Mobile-First Responsive Design

```typescript
// components/goals/ResponsiveGoalCard.tsx

export function ResponsiveGoalCard({ goal }: { goal: Goal }) {
  return (
    <Card className="goal-card">
      {/* Mobile: Compact view */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h3 className="font-semibold">{goal.name}</h3>
            <ProgressBar value={goal.progress} className="mt-2" />
          </div>
          <GoalIcon type={goal.type} className="ml-4" />
        </div>
      </div>

      {/* Tablet/Desktop: Expanded view */}
      <div className="hidden sm:block">
        <div className="flex items-center p-6">
          <GoalIcon type={goal.type} size="lg" />
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold">{goal.name}</h3>
            <p className="text-gray-600">{goal.description}</p>
            <div className="mt-4 flex items-center gap-4">
              <ProgressBar value={goal.progress} className="flex-1" />
              <Badge variant={goal.achieved ? 'success' : 'default'}>
                {goal.current}/{goal.target}
              </Badge>
            </div>
          </div>
          <GoalActions goal={goal} />
        </div>
      </div>
    </Card>
  );
}
```

### 4.4 Visualization Components

```typescript
// components/goals/GoalProgressVisualization.tsx

export function GoalProgressVisualization({ goal, period }: Props) {
  const data = useGoalProgressData(goal.id, period);

  return (
    <div className="goal-visualization">
      {/* Different visualization based on goal type */}
      {goal.type === GoalType.STREAK && (
        <StreakCalendar data={data} />
      )}

      {goal.type === GoalType.COMPLETION_COUNT && (
        <ProgressChart data={data} />
      )}

      {goal.type === GoalType.TIME_BASED && (
        <TimeSpentGraph data={data} />
      )}

      {goal.type === GoalType.PERCENTAGE && (
        <PercentageRadial data={data} />
      )}

      {/* Milestones tracker */}
      <MilestoneProgress milestones={goal.milestones} current={goal.current} />

      {/* Achievement history */}
      <AchievementTimeline achievements={goal.achievements} />
    </div>
  );
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**MVP Features**

1. **Database Setup**
   - Migrate enhanced Goal and Condition models
   - Create indexes for performance
   - Set up initial seed data

2. **Basic Goal Management**
   - CRUD operations for goals
   - Simple progress tracking (completion count)
   - Basic goal-task/routine linking

3. **Basic Condition System**
   - Simple task completion conditions
   - AND/OR logic support
   - Routine visibility control

4. **UI Components**
   - Goal list view
   - Simple goal creation form
   - Basic progress indicators
   - Condition builder (basic)

**Deliverables:**
- Working goal creation and tracking
- Simple conditions for routine visibility
- Basic UI for both features

### Phase 2: Enhanced Features (Week 3-4)

1. **Advanced Goal Types**
   - Implement all goal types (streak, time-based, etc.)
   - Milestone system
   - Achievement tracking and badges

2. **Advanced Conditions**
   - Time-based conditions
   - Context conditions (day of week, date range)
   - Condition templates

3. **Improved UI/UX**
   - Goal creation wizard
   - Visual condition builder
   - Progress visualizations
   - Mobile optimizations

4. **Performance Optimizations**
   - Batch evaluation
   - Caching layer
   - Query optimizations

**Deliverables:**
- Full goal type support
- Rich condition system
- Polished UI components

### Phase 3: Advanced Features (Week 5-6)

1. **Templates and Recipes**
   - Goal template library
   - Condition recipes
   - Template customization

2. **Analytics and Insights**
   - Goal analytics dashboard
   - Progress trends
   - Condition trigger history
   - Performance insights

3. **Notifications**
   - Achievement notifications
   - Streak reminders
   - Progress updates
   - Email/push integration

4. **Teacher-Specific Features**
   - Classroom goals
   - Group progress tracking
   - Attendance-based conditions
   - Bulk goal assignment

**Deliverables:**
- Template system
- Analytics dashboard
- Notification system
- Teacher features

### Phase 4: Polish and Scale (Week 7-8)

1. **Testing**
   - Comprehensive unit tests
   - Integration tests
   - Performance testing
   - User acceptance testing

2. **Documentation**
   - API documentation
   - User guides
   - Video tutorials
   - Best practices guide

3. **Optimization**
   - Database query optimization
   - Frontend bundle optimization
   - Cache tuning
   - Load testing

4. **Migration Tools**
   - Data migration scripts
   - Backward compatibility
   - Rollback procedures

**Deliverables:**
- Production-ready system
- Complete documentation
- Migration tools
- Performance benchmarks

---

## 6. Integration Points

### 6.1 Existing System Integration

```typescript
// Integration with existing routines system
interface RoutineIntegration {
  // Enhance routine visibility checks
  async getVisibleRoutines(roleId: string, personId: string): Promise<Routine[]> {
    const routines = await prisma.routine.findMany({
      where: { roleId, status: 'ACTIVE' }
    });

    // Apply condition-based filtering
    const visibility = await conditionEvaluator.evaluateRoutineVisibility(
      roleId,
      personId,
      await this.getCurrentContext()
    );

    return routines.filter(r =>
      r.visibility !== 'CONDITIONAL' || visibility.get(r.id)
    );
  }

  // Enhance task completion with goal progress
  async completeTask(taskId: string, personId: string, value?: string): Promise<void> {
    // Existing completion logic
    await this.createTaskCompletion(taskId, personId, value);

    // Update related goals
    const goals = await this.getRelatedGoals(taskId);
    for (const goal of goals) {
      await goalEvaluator.evaluateGoal(goal.id, personId);
    }

    // Check condition triggers
    await this.checkConditionTriggers(taskId, personId);
  }
}
```

### 6.2 Cache Strategy

```typescript
// lib/services/cache/goal-condition-cache.ts

export class GoalConditionCache {
  private redis: Redis;

  // Multi-layer caching strategy
  async getCachedEvaluation(key: string): Promise<CachedResult | null> {
    // L1: In-memory cache (very fast, limited size)
    const memCached = this.memoryCache.get(key);
    if (memCached) return memCached;

    // L2: Redis cache (fast, larger size)
    const redisCached = await this.redis.get(key);
    if (redisCached) {
      const parsed = JSON.parse(redisCached);
      this.memoryCache.set(key, parsed); // Promote to L1
      return parsed;
    }

    return null;
  }

  // Intelligent cache invalidation
  async invalidateRelated(entity: 'task' | 'routine' | 'goal', id: string): Promise<void> {
    const patterns = this.getInvalidationPatterns(entity, id);

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }

    // Clear memory cache
    this.memoryCache.clear();
  }
}
```

### 6.3 Performance Considerations

```typescript
// Database query optimizations

// 1. Use proper indexes
@@index([roleId, type, status]) // Composite index for filtered queries
@@index([roleId, scope, status]) // For scope-based queries
@@index([conditionId, personId, evaluatedAt]) // For trigger history

// 2. Batch operations
async function evaluateGoalsBatch(goalIds: string[], personId: string) {
  // Single query with includes
  const goals = await prisma.goal.findMany({
    where: { id: { in: goalIds } },
    include: {
      taskLinks: {
        include: {
          task: {
            include: {
              completions: {
                where: { personId }
              }
            }
          }
        }
      },
      routineLinks: {
        include: {
          routine: {
            include: {
              tasks: {
                include: {
                  completions: {
                    where: { personId }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Process in memory
  return goals.map(goal => evaluateInMemory(goal));
}

// 3. Lazy loading for UI
function useGoalProgress(goalId: string) {
  // Initial fast load (cached or simple calculation)
  const { data: quickProgress } = useQuery({
    queryKey: ['goal-progress-quick', goalId],
    queryFn: () => getQuickProgress(goalId),
    staleTime: 60000 // 1 minute
  });

  // Detailed calculation in background
  const { data: detailedProgress } = useQuery({
    queryKey: ['goal-progress-detailed', goalId],
    queryFn: () => getDetailedProgress(goalId),
    staleTime: 300000, // 5 minutes
    enabled: !!quickProgress // Only after quick load
  });

  return detailedProgress || quickProgress;
}
```

### 6.4 Migration Strategy

```sql
-- Migration script for existing data

-- 1. Migrate existing goals to new schema
ALTER TABLE goals
  ADD COLUMN type TEXT DEFAULT 'COMPLETION_COUNT',
  ADD COLUMN category TEXT DEFAULT 'CUSTOM',
  ADD COLUMN scope TEXT DEFAULT 'INDIVIDUAL',
  ADD COLUMN icon TEXT,
  ADD COLUMN color TEXT,
  ADD COLUMN streak_enabled BOOLEAN DEFAULT false,
  ADD COLUMN current_streak INTEGER DEFAULT 0,
  ADD COLUMN longest_streak INTEGER DEFAULT 0,
  ADD COLUMN last_achieved_at TIMESTAMP;

-- 2. Create new tables
CREATE TABLE goal_achievements (...);
CREATE TABLE goal_milestones (...);
CREATE TABLE goal_notifications (...);
CREATE TABLE condition_triggers (...);

-- 3. Populate with default data
INSERT INTO goal_templates (name, type, category, ...)
VALUES
  ('Daily Reading', 'TIME_BASED', 'EDUCATION', ...),
  ('Weekly Chores', 'COMPLETION_COUNT', 'CHORES', ...),
  ('Homework Streak', 'STREAK', 'EDUCATION', ...);

-- 4. Create indexes for performance
CREATE INDEX idx_goals_role_type_status ON goals(role_id, type, status);
CREATE INDEX idx_conditions_routine ON conditions(routine_id, controls_routine);
```

---

## Conclusion

This comprehensive design provides a robust and scalable Goals and Conditions system for Ruby Routines. The phased implementation approach ensures that core functionality is delivered early while allowing for progressive enhancement.

### Key Benefits

1. **Flexibility**: Supports diverse goal types and condition scenarios
2. **Performance**: Optimized queries, caching, and batch operations
3. **User Experience**: Intuitive UI with visual builders and templates
4. **Scalability**: Designed to handle 100+ goals/conditions per role
5. **Extensibility**: Template system and custom metrics allow future growth

### Success Metrics

- Goal creation time < 2 minutes
- Condition evaluation < 100ms (cached)
- 95% of users successfully create their first goal
- 80% goal completion rate improvement
- < 1% condition evaluation errors

### Next Steps

1. Review and approve design
2. Set up development environment
3. Begin Phase 1 implementation
4. Conduct user testing with prototype
5. Iterate based on feedback