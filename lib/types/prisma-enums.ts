// Temporary type definitions for Prisma enums
// These match the schema.prisma enums until Prisma client can be regenerated

export enum RoleType {
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  PRINCIPAL = 'PRINCIPAL',
}

// Note: This file is deprecated. Use Tier from '@prisma/client' instead.
export enum Tier {
  FREE = 'FREE',
  BRONZE = 'BRONZE',
  GOLD = 'GOLD',
  PRO = 'PRO',
}

export enum GroupType {
  FAMILY = 'FAMILY',
  CLASSROOM = 'CLASSROOM',
  CUSTOM = 'CUSTOM',
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  INACTIVE = 'INACTIVE',
}

export enum RoutineType {
  REGULAR = 'REGULAR',
  SMART = 'SMART',
  TEACHER_CLASSROOM = 'TEACHER_CLASSROOM',
}

export enum ResetPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

export enum Visibility {
  ALWAYS = 'ALWAYS',
  DATE_RANGE = 'DATE_RANGE',
  DAYS_OF_WEEK = 'DAYS_OF_WEEK',
  CONDITIONAL = 'CONDITIONAL',
}

export enum TaskType {
  SIMPLE = 'SIMPLE',
  MULTIPLE_CHECKIN = 'MULTIPLE_CHECKIN',
  PROGRESS = 'PROGRESS',
}

export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR',
}

export enum ConditionOperator {
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_NOT_COMPLETED = 'TASK_NOT_COMPLETED',
  TASK_COUNT_EQUALS = 'TASK_COUNT_EQUALS',
  TASK_COUNT_GT = 'TASK_COUNT_GT',
  TASK_COUNT_LT = 'TASK_COUNT_LT',
  TASK_VALUE_EQUALS = 'TASK_VALUE_EQUALS',
  TASK_VALUE_GT = 'TASK_VALUE_GT',
  TASK_VALUE_LT = 'TASK_VALUE_LT',
  ROUTINE_PERCENT_EQUALS = 'ROUTINE_PERCENT_EQUALS',
  ROUTINE_PERCENT_GT = 'ROUTINE_PERCENT_GT',
  ROUTINE_PERCENT_LT = 'ROUTINE_PERCENT_LT',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  GOAL_NOT_ACHIEVED = 'GOAL_NOT_ACHIEVED',
}

export enum CodeType {
  KIOSK = 'KIOSK',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CONNECTION = 'CONNECTION',
  INVITATION = 'INVITATION',
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
}

export enum CodeStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

export enum InvitationType {
  CO_PARENT = 'CO_PARENT',
  CO_TEACHER = 'CO_TEACHER',
  SCHOOL_TEACHER = 'SCHOOL_TEACHER',
  STUDENT_PARENT = 'STUDENT_PARENT',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum GoalType {
  COMPLETION_COUNT = 'COMPLETION_COUNT',
  STREAK = 'STREAK',
  TIME_BASED = 'TIME_BASED',
  VALUE_BASED = 'VALUE_BASED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum TimeOperator {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  BETWEEN = 'BETWEEN',
}

export enum ShareType {
  PERSON = 'PERSON',
  ROUTINE_ACCESS = 'ROUTINE_ACCESS',
  FULL_ROLE = 'FULL_ROLE',
}

export enum PermissionLevel {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  MANAGE = 'MANAGE',
}
