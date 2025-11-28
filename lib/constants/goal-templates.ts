// Use string types for flexibility with string literals in templates
export interface GoalTemplate {
  id: string
  name: string
  description: string
  type: string
  category: string
  targetAudience: 'PARENT' | 'TEACHER' | 'BOTH'
  ageGroup?: string
  defaultTarget: number
  defaultPeriod: string
  defaultUnit?: string
  icon?: string
  color?: string
  streakEnabled?: boolean
  scope: string
  rewardMessage?: string
}

export const goalTemplates: GoalTemplate[] = [
  // === Streak Goals ===
  {
    id: 'daily-routine-streak',
    name: 'Complete Daily Routine 7 Days in a Row',
    description: 'Build consistency by completing your daily routine for a full week',
    type: 'STREAK',
    category: 'BEHAVIOR',
    targetAudience: 'BOTH',
    ageGroup: '5-12',
    defaultTarget: 7,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'days',
    icon: '🔥',
    color: '#FF6B6B',
    streakEnabled: true,
    scope: 'INDIVIDUAL',
    rewardMessage: 'Amazing! You completed a full week streak!'
  },
  {
    id: 'maintain-5-day-streak',
    name: 'Maintain 5-Day Streak',
    description: 'Keep up your momentum with a 5-day consecutive streak',
    type: 'STREAK',
    category: 'BEHAVIOR',
    targetAudience: 'BOTH',
    ageGroup: '3-8',
    defaultTarget: 5,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'days',
    icon: '⭐',
    color: '#FFD93D',
    streakEnabled: true,
    scope: 'INDIVIDUAL',
    rewardMessage: 'Fantastic! 5 days in a row!'
  },
  {
    id: 'monthly-perfect-attendance',
    name: 'Perfect Monthly Attendance',
    description: 'Complete all routines every day for a month',
    type: 'STREAK',
    category: 'BEHAVIOR',
    targetAudience: 'BOTH',
    ageGroup: '8-16',
    defaultTarget: 30,
    defaultPeriod: 'MONTHLY',
    defaultUnit: 'days',
    icon: '🏆',
    color: '#6BCF7F',
    streakEnabled: true,
    scope: 'INDIVIDUAL',
    rewardMessage: 'Incredible! Perfect attendance for a whole month!'
  },

  // === Completion Count Goals ===
  {
    id: 'finish-20-tasks-week',
    name: 'Finish 20 Tasks This Week',
    description: 'Complete 20 tasks throughout the week',
    type: 'COMPLETION_COUNT',
    category: 'CHORES',
    targetAudience: 'BOTH',
    ageGroup: '6-14',
    defaultTarget: 20,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'tasks',
    icon: '✅',
    color: '#4ECDC4',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Great job! You completed 20 tasks this week!'
  },
  {
    id: 'daily-reading-goal',
    name: 'Read 3 Books This Week',
    description: 'Complete reading tasks for 3 different books',
    type: 'COMPLETION_COUNT',
    category: 'EDUCATION',
    targetAudience: 'BOTH',
    ageGroup: '6-12',
    defaultTarget: 3,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'books',
    icon: '📚',
    color: '#95E1D3',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Wonderful! You read 3 books this week!'
  },
  {
    id: 'homework-completion',
    name: 'Complete All Homework Tasks',
    description: 'Finish all assigned homework tasks for the week',
    type: 'COMPLETION_COUNT',
    category: 'EDUCATION',
    targetAudience: 'BOTH',
    ageGroup: '8-18',
    defaultTarget: 10,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'assignments',
    icon: '📝',
    color: '#A8E6CF',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Excellent! All homework completed!'
  },

  // === Percentage Goals ===
  {
    id: 'complete-morning-tasks',
    name: 'Complete All Morning Tasks',
    description: 'Achieve 100% completion of morning routine tasks',
    type: 'PERCENTAGE',
    category: 'BEHAVIOR',
    targetAudience: 'BOTH',
    ageGroup: '4-12',
    defaultTarget: 100,
    defaultPeriod: 'DAILY',
    defaultUnit: '%',
    icon: '🌅',
    color: '#FFB6C1',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Perfect morning routine! Well done!'
  },
  {
    id: 'weekly-routine-completion',
    name: '90% Weekly Routine Completion',
    description: 'Complete at least 90% of all routine tasks for the week',
    type: 'PERCENTAGE',
    category: 'BEHAVIOR',
    targetAudience: 'BOTH',
    ageGroup: '6-16',
    defaultTarget: 90,
    defaultPeriod: 'WEEKLY',
    defaultUnit: '%',
    icon: '🎯',
    color: '#C7CEEA',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Outstanding! Over 90% completion rate!'
  },

  // === Time-Based Goals ===
  {
    id: 'reading-time-goal',
    name: '30 Minutes Daily Reading',
    description: 'Spend at least 30 minutes reading each day',
    type: 'TIME_BASED',
    category: 'EDUCATION',
    targetAudience: 'BOTH',
    ageGroup: '7-14',
    defaultTarget: 30,
    defaultPeriod: 'DAILY',
    defaultUnit: 'minutes',
    icon: '⏱️',
    color: '#B4A7D6',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Great reading session! 30 minutes complete!'
  },
  {
    id: 'weekly-exercise-time',
    name: '3 Hours Weekly Exercise',
    description: 'Accumulate 3 hours of exercise throughout the week',
    type: 'TIME_BASED',
    category: 'HEALTH',
    targetAudience: 'BOTH',
    ageGroup: '8-18',
    defaultTarget: 180,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'minutes',
    icon: '🏃',
    color: '#FFD700',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Awesome! 3 hours of exercise this week!'
  },
  {
    id: 'practice-time-goal',
    name: 'Daily Music Practice',
    description: 'Practice music instrument for 20 minutes daily',
    type: 'TIME_BASED',
    category: 'CREATIVE',
    targetAudience: 'BOTH',
    ageGroup: '6-16',
    defaultTarget: 20,
    defaultPeriod: 'DAILY',
    defaultUnit: 'minutes',
    icon: '🎵',
    color: '#DDA0DD',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Beautiful practice session!'
  },

  // === Teacher-Specific Templates ===
  {
    id: 'classroom-participation',
    name: 'Classroom Participation Goal',
    description: 'Track class-wide participation in activities',
    type: 'PERCENTAGE',
    category: 'EDUCATION',
    targetAudience: 'TEACHER',
    defaultTarget: 80,
    defaultPeriod: 'WEEKLY',
    defaultUnit: '%',
    icon: '🏫',
    color: '#4A90E2',
    scope: 'GROUP',
    rewardMessage: 'Great classroom participation this week!'
  },
  {
    id: 'class-homework-submission',
    name: 'Class Homework Submission',
    description: 'Track percentage of students submitting homework on time',
    type: 'PERCENTAGE',
    category: 'EDUCATION',
    targetAudience: 'TEACHER',
    defaultTarget: 95,
    defaultPeriod: 'WEEKLY',
    defaultUnit: '%',
    icon: '📋',
    color: '#50C878',
    scope: 'GROUP',
    rewardMessage: 'Excellent homework submission rate!'
  },
  {
    id: 'classroom-behavior-streak',
    name: 'Classroom Good Behavior Streak',
    description: 'Consecutive days of positive classroom behavior',
    type: 'STREAK',
    category: 'BEHAVIOR',
    targetAudience: 'TEACHER',
    defaultTarget: 5,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'days',
    icon: '🌟',
    color: '#FFB347',
    streakEnabled: true,
    scope: 'GROUP',
    rewardMessage: 'Amazing classroom behavior streak!'
  },
  {
    id: 'class-reading-challenge',
    name: 'Class Reading Challenge',
    description: 'Total books read by the entire class',
    type: 'COMPLETION_COUNT',
    category: 'EDUCATION',
    targetAudience: 'TEACHER',
    defaultTarget: 50,
    defaultPeriod: 'MONTHLY',
    defaultUnit: 'books',
    icon: '📖',
    color: '#87CEEB',
    scope: 'GROUP',
    rewardMessage: 'Incredible! The class read 50 books!'
  },

  // === Social Goals ===
  {
    id: 'helping-others',
    name: 'Helping Others Goal',
    description: 'Complete tasks that involve helping family or classmates',
    type: 'COMPLETION_COUNT',
    category: 'SOCIAL',
    targetAudience: 'BOTH',
    ageGroup: '5-14',
    defaultTarget: 5,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'helpful acts',
    icon: '🤝',
    color: '#F4A460',
    scope: 'INDIVIDUAL',
    rewardMessage: 'You\'re so helpful! Great job!'
  },
  {
    id: 'teamwork-activities',
    name: 'Teamwork Activities',
    description: 'Participate in group activities and team projects',
    type: 'COMPLETION_COUNT',
    category: 'SOCIAL',
    targetAudience: 'TEACHER',
    defaultTarget: 3,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'activities',
    icon: '👥',
    color: '#9370DB',
    scope: 'GROUP',
    rewardMessage: 'Excellent teamwork!'
  },

  // === Creative Goals ===
  {
    id: 'creative-projects',
    name: 'Weekly Creative Projects',
    description: 'Complete creative projects like art, crafts, or writing',
    type: 'COMPLETION_COUNT',
    category: 'CREATIVE',
    targetAudience: 'BOTH',
    ageGroup: '5-16',
    defaultTarget: 2,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'projects',
    icon: '🎨',
    color: '#FF69B4',
    scope: 'INDIVIDUAL',
    rewardMessage: 'Amazing creativity this week!'
  },
  {
    id: 'daily-journal-streak',
    name: 'Daily Journal Writing',
    description: 'Write in your journal every day',
    type: 'STREAK',
    category: 'CREATIVE',
    targetAudience: 'BOTH',
    ageGroup: '8-18',
    defaultTarget: 7,
    defaultPeriod: 'WEEKLY',
    defaultUnit: 'days',
    icon: '✍️',
    color: '#DEB887',
    streakEnabled: true,
    scope: 'INDIVIDUAL',
    rewardMessage: 'Wonderful journal streak!'
  }
]

// Helper functions to filter templates
export function getTemplatesByAudience(audience: 'PARENT' | 'TEACHER' | 'BOTH'): GoalTemplate[] {
  return goalTemplates.filter(
    template => template.targetAudience === audience || template.targetAudience === 'BOTH'
  )
}

export function getTemplatesByCategory(category: string): GoalTemplate[] {
  return goalTemplates.filter(template => template.category === category)
}

export function getTemplatesByType(type: string): GoalTemplate[] {
  return goalTemplates.filter(template => template.type === type)
}

export function getTemplateById(id: string): GoalTemplate | undefined {
  return goalTemplates.find(template => template.id === id)
}

export function getTemplatesForAgeGroup(age: number): GoalTemplate[] {
  return goalTemplates.filter(template => {
    if (!template.ageGroup) return true
    const parts = template.ageGroup.split('-').map(Number)
    const min = parts[0]
    const max = parts[1]
    if (min === undefined || max === undefined) return true
    return age >= min && age <= max
  })
}