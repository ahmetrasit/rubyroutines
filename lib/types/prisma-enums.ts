// Temporary type definitions for Prisma enums
// These match the schema.prisma enums until Prisma client can be regenerated

export enum RoleType {
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  PRINCIPAL = 'PRINCIPAL',
}

export enum Tier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  SCHOOL = 'SCHOOL',
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
  SMART = 'SMART',
}

export enum ConditionType {
  TASK_COMPLETED = 'TASK_COMPLETED',
  ROUTINE_COMPLETED = 'ROUTINE_COMPLETED',
  TASK_COUNT = 'TASK_COUNT',
  ROUTINE_PERCENTAGE = 'ROUTINE_PERCENTAGE',
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
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
