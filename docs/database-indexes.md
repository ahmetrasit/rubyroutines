# Database Index Optimization

## Overview
This document describes the database indexes added to optimize routine filtering queries and improve overall application performance.

## Problem Statement
Several queries in the application were filtering data by multiple fields without composite indexes, potentially causing slow queries as the database grows. The most critical performance bottleneck was identified in routine filtering queries that combine `roleId`, `isTeacherOnly`, and `status` fields.

## Indexes Added

### 1. Routine Model Indexes

#### Composite Index: `(roleId, isTeacherOnly, status)`
- **Purpose**: Optimizes the most common query pattern in the application
- **Used by**:
  - `lib/trpc/routers/kiosk.ts` (line 217) - Filtering non-teacher routines in kiosk mode
  - `lib/trpc/routers/person.ts` (lines 129-133) - Filtering routines based on user role
  - `lib/trpc/routers/routine.ts` (lines 30-33) - General routine filtering
- **Performance Impact**: Reduces query time from O(n) full table scan to O(log n) index lookup
- **Query Pattern**: `WHERE roleId = ? AND isTeacherOnly = ? AND status = ?`

#### Composite Index: `(roleId, type, status)`
- **Purpose**: Optimizes queries filtering routines by type (REGULAR, SMART, TEACHER_CLASSROOM)
- **Used by**: Smart routine evaluation and type-specific queries
- **Performance Impact**: Speeds up role-based routine type filtering

#### Single Index: `isTeacherOnly`
- **Purpose**: Optimizes queries that only filter by teacher-only flag
- **Used by**: Quick filtering of teacher-only content across the application
- **Performance Impact**: Enables fast boolean filtering when used in isolation

### 2. Person Model Indexes

#### Composite Index: `(roleId, status)`
- **Purpose**: Optimizes person queries filtered by role and active status
- **Used by**: Person list queries, role-based person filtering
- **Performance Impact**: Speeds up active person retrieval per role

#### Composite Index: `(roleId, isAccountOwner)`
- **Purpose**: Quickly finds the account owner ("Me" person) for a given role
- **Used by**: Dashboard queries, account owner identification
- **Performance Impact**: O(1) lookup for account owner instead of scanning all persons

### 3. Group Model Indexes

#### Composite Index: `(roleId, status)`
- **Purpose**: Optimizes group queries filtered by role and active status
- **Used by**: Group list queries, classroom management
- **Performance Impact**: Faster group retrieval for role-based views

#### Composite Index: `(roleId, type, status)`
- **Purpose**: Optimizes queries filtering groups by type (FAMILY, CLASSROOM, CUSTOM)
- **Used by**: Classroom-specific queries, family group filtering
- **Performance Impact**: Efficient type-based group filtering

### 4. Task Model Indexes

#### Composite Index: `(routineId, status)`
- **Purpose**: Optimizes retrieval of active tasks within routines
- **Used by**: Routine detail views, task completion queries
- **Performance Impact**: Faster task loading when displaying routines

#### Composite Index: `(routineId, order)`
- **Purpose**: Optimizes ordered task retrieval within routines
- **Used by**: Task display in correct order
- **Performance Impact**: Eliminates need for in-memory sorting

### 5. Code Model Indexes

#### Composite Index: `(code, status)`
- **Purpose**: Optimizes kiosk code lookup with status verification
- **Used by**: Kiosk authentication, code validation
- **Performance Impact**: Fast code verification (critical for kiosk UX)

#### Composite Index: `(roleId, status, type)`
- **Purpose**: Optimizes role-based code queries by type
- **Used by**: Code management, type-specific code retrieval
- **Performance Impact**: Efficient code listing per role

### 6. Goal Model Indexes

#### Composite Index: `(roleId, status)`
- **Purpose**: Optimizes active goal queries by role
- **Used by**: Goal tracking, progress monitoring
- **Performance Impact**: Faster goal retrieval for dashboards

## Expected Performance Improvements

### Before Optimization
- Full table scans on large tables
- Query time increases linearly with data growth
- Potential for slow queries as user base scales

### After Optimization
- Index-based lookups with logarithmic time complexity
- Consistent query performance regardless of table size
- Reduced database CPU usage and improved concurrent user support

## Migration Details
- **Migration Name**: `add_routine_performance_indexes`
- **Migration File**: `20251118114133_add_routine_performance_indexes/migration.sql`
- **Applied**: Pending database connection

## Best Practices for Future Development

1. **Always consider indexes when adding new query patterns**
2. **Use composite indexes for multi-field WHERE clauses**
3. **Order composite index fields by selectivity (most selective first)**
4. **Monitor query performance using database EXPLAIN plans**
5. **Avoid over-indexing (each index has storage and write performance costs)**

## Monitoring Recommendations

1. **Track Query Performance**: Monitor slow query logs to identify new optimization opportunities
2. **Index Usage**: Use database tools to verify indexes are being utilized
3. **Table Statistics**: Keep database statistics updated for optimal query planning
4. **Regular Reviews**: Periodically review query patterns and index effectiveness

## Testing
A test script is available at `scripts/test-indexes.ts` to verify index functionality and measure query performance improvements.