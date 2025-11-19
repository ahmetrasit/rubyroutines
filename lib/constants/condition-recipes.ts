import { ConditionLogic, ConditionOperator, TimeOperator, ContextType } from '@prisma/client'

export interface ConditionRecipe {
  id: string
  name: string
  description: string
  category: 'TIME_BASED' | 'SEQUENCE' | 'ACHIEVEMENT' | 'CONTEXT' | 'TASK_BASED'
  targetAudience: 'PARENT' | 'TEACHER' | 'BOTH'
  logic: ConditionLogic
  checks: Array<{
    operator: ConditionOperator
    value?: string
    value2?: string
    negate?: boolean
    timeOperator?: TimeOperator
    timeValue?: string
    dayOfWeek?: number[]
    contextType?: ContextType
    contextValue?: string
    description?: string
  }>
  icon?: string
  usageHint?: string
}

export const conditionRecipes: ConditionRecipe[] = [
  // === Time-Based Conditions ===
  {
    id: 'weekdays-only',
    name: 'Weekdays Only',
    description: 'Show routine only on Monday through Friday',
    category: 'TIME_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'DAY_OF_WEEK',
        dayOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        description: 'Active on weekdays'
      }
    ],
    icon: '📅',
    usageHint: 'Perfect for school-related routines'
  },
  {
    id: 'weekend-only',
    name: 'Weekend Only',
    description: 'Show routine only on Saturday and Sunday',
    category: 'TIME_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'DAY_OF_WEEK',
        dayOfWeek: [0, 6], // Saturday and Sunday
        description: 'Active on weekends'
      }
    ],
    icon: '🏖️',
    usageHint: 'Great for weekend chores or activities'
  },
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Available from 6 AM to 12 PM',
    category: 'TIME_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'TIME_OF_DAY',
        timeOperator: 'BETWEEN',
        timeValue: '06:00',
        value2: '12:00',
        description: 'Morning time window'
      }
    ],
    icon: '🌅',
    usageHint: 'Ideal for morning prep routines'
  },
  {
    id: 'after-school',
    name: 'After School',
    description: 'Available from 3 PM to 6 PM',
    category: 'TIME_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'TIME_OF_DAY',
        timeOperator: 'BETWEEN',
        timeValue: '15:00',
        value2: '18:00',
        description: 'After school hours'
      }
    ],
    icon: '🎒',
    usageHint: 'Perfect for homework and after-school activities'
  },
  {
    id: 'evening-routine',
    name: 'Evening Routine',
    description: 'Available from 6 PM to 9 PM',
    category: 'TIME_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'TIME_OF_DAY',
        timeOperator: 'BETWEEN',
        timeValue: '18:00',
        value2: '21:00',
        description: 'Evening hours'
      }
    ],
    icon: '🌙',
    usageHint: 'Great for dinner and bedtime routines'
  },
  {
    id: 'school-days-morning',
    name: 'School Day Mornings',
    description: 'Weekday mornings from 6 AM to 8 AM',
    category: 'TIME_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'DAY_OF_WEEK',
        dayOfWeek: [1, 2, 3, 4, 5],
        description: 'Weekdays only'
      },
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'TIME_OF_DAY',
        timeOperator: 'BETWEEN',
        timeValue: '06:00',
        value2: '08:00',
        description: 'Early morning'
      }
    ],
    icon: '🏫',
    usageHint: 'Perfect for getting ready for school'
  },

  // === Task-Based Conditions ===
  {
    id: 'when-tasks-completed',
    name: 'When Tasks Completed',
    description: 'Show when specific tasks are done',
    category: 'TASK_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'TASK_COMPLETED',
        description: 'Previous task completed',
        value: 'PLACEHOLDER_TASK_ID'
      }
    ],
    icon: '✅',
    usageHint: 'Create sequential task dependencies'
  },
  {
    id: 'after-morning-complete',
    name: 'After Morning Tasks',
    description: 'Available after morning routine is complete',
    category: 'TASK_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'ROUTINE_COMPLETED',
        description: 'Morning routine done',
        value: 'PLACEHOLDER_ROUTINE_ID'
      }
    ],
    icon: '☀️',
    usageHint: 'Unlock afternoon activities after morning is done'
  },
  {
    id: 'homework-first',
    name: 'Homework First',
    description: 'Available only after homework is complete',
    category: 'TASK_BASED',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'TASK_COUNT_GT',
        value: '0',
        description: 'At least one homework task completed today'
      }
    ],
    icon: '📚',
    usageHint: 'Ensure homework is done before fun activities'
  },
  {
    id: 'chores-before-play',
    name: 'Chores Before Play',
    description: 'Fun activities available after chores',
    category: 'TASK_BASED',
    targetAudience: 'PARENT',
    logic: 'OR',
    checks: [
      {
        operator: 'ROUTINE_PERCENT_GT',
        value: '80',
        description: 'Most chores completed'
      },
      {
        operator: 'ROUTINE_COMPLETED',
        description: 'All chores done'
      }
    ],
    icon: '🎮',
    usageHint: 'Motivate chore completion'
  },

  // === Achievement-Based Conditions ===
  {
    id: 'reward-for-streak',
    name: 'Reward for Streak',
    description: 'Unlock special routine after maintaining streak',
    category: 'ACHIEVEMENT',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'TASK_STREAK_GT',
        value: '3',
        description: 'Streak of 3 or more days'
      }
    ],
    icon: '🔥',
    usageHint: 'Reward consistent behavior'
  },
  {
    id: 'goal-achieved-unlock',
    name: 'Goal Achievement Unlock',
    description: 'Available after achieving a specific goal',
    category: 'ACHIEVEMENT',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'GOAL_ACHIEVED',
        description: 'Goal has been achieved',
        value: 'PLACEHOLDER_GOAL_ID'
      }
    ],
    icon: '🏆',
    usageHint: 'Unlock rewards for goal completion'
  },
  {
    id: 'milestone-reward',
    name: 'Milestone Reward',
    description: 'Special routine when milestone is reached',
    category: 'ACHIEVEMENT',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'GOAL_MILESTONE_REACHED',
        description: 'Milestone achieved',
        value: 'PLACEHOLDER_GOAL_ID'
      }
    ],
    icon: '⭐',
    usageHint: 'Celebrate milestone achievements'
  },
  {
    id: 'high-performer-bonus',
    name: 'High Performer Bonus',
    description: 'Extra activities for high completion rates',
    category: 'ACHIEVEMENT',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'ROUTINE_PERCENT_GT',
        value: '90',
        description: 'Over 90% completion rate'
      }
    ],
    icon: '💯',
    usageHint: 'Reward excellent performance'
  },

  // === Context-Based Conditions (Teacher) ===
  {
    id: 'classroom-attendance',
    name: 'When Present in Class',
    description: 'Available only when student is present',
    category: 'CONTEXT',
    targetAudience: 'TEACHER',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'ATTENDANCE',
        contextValue: 'present',
        description: 'Student is present'
      }
    ],
    icon: '📋',
    usageHint: 'Track in-class activities'
  },
  {
    id: 'group-activity',
    name: 'Group Activity Time',
    description: 'Available during group work periods',
    category: 'CONTEXT',
    targetAudience: 'TEACHER',
    logic: 'AND',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'CUSTOM',
        contextValue: 'group_time',
        description: 'During group activities'
      }
    ],
    icon: '👥',
    usageHint: 'Schedule group work'
  },
  {
    id: 'weather-dependent',
    name: 'Weather Dependent',
    description: 'Available based on weather conditions',
    category: 'CONTEXT',
    targetAudience: 'BOTH',
    logic: 'OR',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'WEATHER',
        contextValue: 'sunny',
        description: 'Nice weather'
      },
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'WEATHER',
        contextValue: 'partly_cloudy',
        description: 'Decent weather'
      }
    ],
    icon: '☀️',
    usageHint: 'Plan outdoor activities'
  },

  // === Sequence Conditions ===
  {
    id: 'step-by-step',
    name: 'Step by Step',
    description: 'Sequential task unlocking',
    category: 'SEQUENCE',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'TASK_COUNT_EQUALS',
        value: '1',
        description: 'Exactly one task from previous step completed'
      }
    ],
    icon: '📶',
    usageHint: 'Create ordered task sequences'
  },
  {
    id: 'progressive-difficulty',
    name: 'Progressive Difficulty',
    description: 'Unlock harder tasks as easier ones are completed',
    category: 'SEQUENCE',
    targetAudience: 'BOTH',
    logic: 'AND',
    checks: [
      {
        operator: 'TASK_COUNT_GT',
        value: '5',
        description: 'Complete 5 basic tasks first'
      },
      {
        operator: 'ROUTINE_PERCENT_GT',
        value: '50',
        description: 'At least half of routine done'
      }
    ],
    icon: '📈',
    usageHint: 'Gradually increase difficulty'
  },
  {
    id: 'daily-progression',
    name: 'Daily Progression',
    description: 'Different tasks throughout the day',
    category: 'SEQUENCE',
    targetAudience: 'BOTH',
    logic: 'OR',
    checks: [
      {
        operator: 'CONTEXT_EQUALS',
        contextType: 'TIME_OF_DAY',
        timeOperator: 'BEFORE',
        timeValue: '12:00',
        description: 'Morning tasks',
        negate: false
      },
      {
        operator: 'ROUTINE_STARTED',
        description: 'Routine already begun',
        negate: false
      }
    ],
    icon: '⏰',
    usageHint: 'Structure activities throughout the day'
  }
]

// Helper functions to work with recipes
export function getRecipesByCategory(category: string): ConditionRecipe[] {
  return conditionRecipes.filter(recipe => recipe.category === category)
}

export function getRecipesByAudience(audience: 'PARENT' | 'TEACHER' | 'BOTH'): ConditionRecipe[] {
  return conditionRecipes.filter(
    recipe => recipe.targetAudience === audience || recipe.targetAudience === 'BOTH'
  )
}

export function getRecipeById(id: string): ConditionRecipe | undefined {
  return conditionRecipes.find(recipe => recipe.id === id)
}

export function applyRecipeValues(
  recipe: ConditionRecipe,
  customValues: Record<string, string>
): ConditionRecipe {
  const appliedRecipe = { ...recipe }

  appliedRecipe.checks = recipe.checks.map(check => {
    const newCheck = { ...check }

    // Replace placeholder values with custom values
    if (check.value?.startsWith('PLACEHOLDER_')) {
      const key = check.value.replace('PLACEHOLDER_', '').toLowerCase()
      if (customValues[key]) {
        newCheck.value = customValues[key]
      }
    }

    return newCheck
  })

  return appliedRecipe
}