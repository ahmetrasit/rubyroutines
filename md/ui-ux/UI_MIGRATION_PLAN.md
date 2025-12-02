# UI Migration Plan: KidTrek → Ruby Routines

**Date**: November 13, 2024
**Status**: AWAITING APPROVAL
**Risk Level**: LOW (UI-only, no logic migration)

---

## Executive Summary

This plan migrates **visual UI components only** from KidTrek to Ruby Routines while preserving **ALL existing business logic, state management, and data handling** in Ruby Routines.

### Migration Scope
- ✅ **Migrate**: CSS styles, Tailwind classes, layout patterns, visual hierarchy
- ❌ **DO NOT Migrate**: Business logic, state management, data fetching, validation logic

---

## 1. UI ELEMENTS TO MIGRATE

### 1.1 Core UI Components (Level 0 - No Dependencies)

#### Button Component
**From KidTrek**:
- 5 variants (default, secondary, outline, ghost, danger)
- 3 sizes (sm, md, lg)
- Touch-target classes (min 44px)
- Hover/focus states with ring-2 focus rings
- Loading state support

**Connect to Ruby Routines Logic**:
- All existing `onClick` handlers preserved
- `mutation.isPending` for loading states
- All form submissions continue using existing validation

**Business Logic**: ✅ **NONE COPIED** (just visual styles)

---

#### Card Component
**From KidTrek**:
- Base card with rounded-xl, shadow-md
- CardHeader, CardTitle, CardContent subcomponents
- Hover shadow-lg transition

**Connect to Ruby Routines Logic**:
- PersonCard: Uses existing `person` prop, `onSelectPerson` callback
- RoutineCard: Uses existing `routine` prop, `trpc.routine.delete` mutation
- TaskItem: Uses existing `task` prop, completion logic

**Business Logic**: ✅ **NONE COPIED** (just card styling)

---

#### Dialog/Modal Component
**From KidTrek**:
- Overlay with backdrop blur
- Escape key handler
- Body scroll lock
- DialogHeader, DialogTitle, DialogContent subcomponents
- z-index: 60 (above other elements)

**Connect to Ruby Routines Logic**:
- All existing form dialogs (PersonForm, RoutineForm, TaskForm)
- Existing `showForm`, `showEdit` state variables
- Existing `onClose` callbacks

**Business Logic**: ✅ **NONE COPIED** (just modal styling)

---

#### Input Component
**From KidTrek**:
- Focus ring with primary-500 color
- Rounded-lg borders
- Disabled state styling
- Error state support

**Connect to Ruby Routines Logic**:
- All existing form fields
- Existing onChange handlers
- Existing validation state

**Business Logic**: ✅ **NONE COPIED** (just input styling)

---

### 1.2 Feature Components (Level 2-3)

#### PersonForm UI Enhancements
**From KidTrek**:
- 32-color palette grid (8 columns, rounded-full selectors)
- 99 emoji grid with search (keyword filtering)
- Live preview section showing final avatar
- Info boxes with colored backgrounds
- Form field labels with proper spacing

**Connect to Ruby Routines Logic**:
- ✅ Existing `trpc.person.create.useMutation`
- ✅ Existing `trpc.person.update.useMutation`
- ✅ Existing tier limit enforcement
- ✅ Existing avatar JSON serialization: `{ color, emoji }`
- ✅ Existing validation schemas

**Business Logic**: ✅ **NONE COPIED** - All mutations, validations, tier checks remain unchanged

---

#### PersonCard UI Enhancements
**From KidTrek**:
- Border-top-4 with avatar color
- Semi-transparent avatar background (color + '20')
- Hover shadow transition
- Edit/delete button positioning
- Text truncation for long names

**Connect to Ruby Routines Logic**:
- ✅ Existing `person` object parsing
- ✅ Existing `onSelectPerson` callback
- ✅ Existing "Me" person delete protection
- ✅ Existing `trpc.person.delete` mutation

**Business Logic**: ✅ **NONE COPIED** - Just visual presentation

---

#### RoutineCard UI Enhancements
**From KidTrek**:
- Badge styling for task count (rounded-full)
- Visibility indicator icons
- Person assignment tags
- Metadata layout (reset period, visibility description)
- Opacity effect when routine not visible

**Connect to Ruby Routines Logic**:
- ✅ Existing `isRoutineVisible()` service utility
- ✅ Existing `getResetDescription()` service
- ✅ Existing "Daily Routine" delete protection
- ✅ Existing `trpc.routine.delete` mutation

**Business Logic**: ✅ **NONE COPIED** - Visibility and reset logic unchanged

---

#### TaskForm UI Enhancements
**From KidTrek**:
- 40 task icon grid (10x4, visual selection)
- Task type selector with info boxes
- Live preview section
- Colored info boxes for each task type
- PROGRESS type conditional fields

**Connect to Ruby Routines Logic**:
- ✅ Existing `trpc.task.create.useMutation`
- ✅ Existing PROGRESS type validation (targetValue + unit required)
- ✅ Existing tier limit enforcement
- ✅ Existing type-specific field validation

**Business Logic**: ✅ **NONE COPIED** - All task creation logic preserved

---

#### TaskItem UI Enhancements
**From KidTrek**:
- Type-specific UI layouts:
  - SIMPLE: "✓ Done today" badge, undo button with timer
  - MULTIPLE_CHECKIN: "Multi Check-in" badge, completion counter
  - PROGRESS: Progress bar with percentage, value input
- Hover effects on cards
- Fixed-size action buttons (h-8 w-8)
- Icon display with text-3xl size

**Connect to Ruby Routines Logic**:
- ✅ Existing `trpc.task.complete.useMutation`
- ✅ Existing `trpc.task.undoCompletion.useMutation`
- ✅ Existing `canUndoCompletion()` service check
- ✅ Existing undo timer countdown logic
- ✅ Existing task aggregation calculations

**Business Logic**: ✅ **NONE COPIED** - All completion tracking preserved

---

### 1.3 List Components

#### PersonList, RoutineList, TaskList
**From KidTrek**:
- Grid layout (1 col mobile, 2 md, 3 lg)
- Empty state with emoji + friendly message
- "Add" button styling
- Heading hierarchy (text-2xl font-bold)
- Proper gap spacing (gap-4, space-y-6)

**Connect to Ruby Routines Logic**:
- ✅ Existing `trpc.*.list` queries
- ✅ Existing loading states
- ✅ Existing `showForm` state toggles
- ✅ Existing restore dialogs

**Business Logic**: ✅ **NONE COPIED** - Just layout and empty states

---

### 1.4 Page Layouts

#### Dashboard Layout
**From KidTrek**:
- max-w-7xl container
- px-4 sm:px-6 lg:px-8 responsive padding
- py-8 vertical spacing
- bg-gray-50 background

**Connect to Ruby Routines Logic**:
- ✅ Existing auth guards
- ✅ Existing session checks
- ✅ Existing routing logic

**Business Logic**: ✅ **NONE COPIED** - Just container styling

---

#### Auth Pages Layout
**From KidTrek**:
- Centered form container
- Card-based form presentation
- Responsive width (max-w-md)
- Vertical spacing

**Connect to Ruby Routines Logic**:
- ✅ Existing `trpc.auth.signUp` mutation
- ✅ Existing `trpc.auth.signIn` mutation
- ✅ Existing Supabase auth integration
- ✅ Existing redirect logic

**Business Logic**: ✅ **NONE COPIED** - Just form styling

---

### 1.5 Interactive Patterns

#### Toast Notifications
**From KidTrek**:
- 3 variants (default, success, destructive)
- Auto-dismiss after 5 seconds
- Position: bottom-right
- Animation: slide-in from right

**Connect to Ruby Routines Logic**:
- ✅ Existing mutation onSuccess/onError handlers
- ✅ Existing toast messages preserved

**Business Logic**: ✅ **NONE COPIED** - Just toast styling

---

## 2. RUBY ROUTINES LOGIC/STATE CONNECTIONS

### 2.1 tRPC Endpoints (100% Preserved)

All existing tRPC routers remain **completely unchanged**:

- ✅ `trpc.auth.*` - All auth logic preserved
- ✅ `trpc.person.*` - All CRUD + tier limits + "Me" person logic
- ✅ `trpc.routine.*` - All CRUD + visibility + reset period + "Daily Routine" protection
- ✅ `trpc.task.*` - All CRUD + completion + undo + type validation
- ✅ `trpc.group.*` - All group management

### 2.2 Service Utilities (100% Preserved)

All business logic services remain **completely unchanged**:

- ✅ `/lib/services/tier-limits.ts` - Tier enforcement logic
- ✅ `/lib/services/reset-period.ts` - Reset calculations
- ✅ `/lib/services/visibility-rules.ts` - Visibility checks
- ✅ `/lib/services/task-completion.ts` - Aggregation + undo logic

### 2.3 Validation Schemas (100% Preserved)

All Zod schemas remain **completely unchanged**:

- ✅ `/lib/validation/person.ts`
- ✅ `/lib/validation/routine.ts`
- ✅ `/lib/validation/task.ts`
- ✅ `/lib/validation/group.ts`

### 2.4 State Management (100% Preserved)

All React state patterns remain **completely unchanged**:

- ✅ React Query caching via tRPC
- ✅ Local useState for forms, modals, UI state
- ✅ Mutation invalidation patterns
- ✅ Conditional query enabling
- ✅ Loading state checks (`isPending`)

### 2.5 Data Flow (100% Preserved)

All existing data flows remain **completely unchanged**:

- ✅ Form submission → validation → tRPC mutation → invalidation → toast
- ✅ Task completion → aggregation → undo window check
- ✅ Person creation → tier check → "Daily Routine" auto-creation
- ✅ Soft delete → status update → restore flow

---

## 3. BUSINESS LOGIC VERIFICATION

### ✅ Confirmed: NO Business Logic Migration

| Category | Migration Status |
|----------|------------------|
| tRPC Mutations | ❌ NOT MIGRATED (existing logic preserved) |
| Validation Logic | ❌ NOT MIGRATED (existing Zod schemas) |
| Tier Enforcement | ❌ NOT MIGRATED (existing service) |
| Reset Period Calculations | ❌ NOT MIGRATED (existing service) |
| Visibility Rules | ❌ NOT MIGRATED (existing service) |
| Task Aggregation | ❌ NOT MIGRATED (existing service) |
| Undo Logic | ❌ NOT MIGRATED (existing service) |
| Soft Delete Handling | ❌ NOT MIGRATED (existing pattern) |
| Auth Flow | ❌ NOT MIGRATED (existing Supabase integration) |
| "Me" Person Protection | ❌ NOT MIGRATED (existing check) |
| "Daily Routine" Protection | ❌ NOT MIGRATED (existing check) |

### What IS Being Migrated (Visual Only)

| Category | Migration Status |
|----------|------------------|
| Tailwind CSS Classes | ✅ MIGRATED |
| Component Structure (JSX layout) | ✅ MIGRATED |
| Color Palette | ✅ MIGRATED |
| Spacing System | ✅ MIGRATED |
| Typography Styles | ✅ MIGRATED |
| Hover/Focus States | ✅ MIGRATED |
| Animation Transitions | ✅ MIGRATED |
| Responsive Breakpoints | ✅ MIGRATED |
| Touch Target Utilities | ✅ MIGRATED |
| Empty State Patterns | ✅ MIGRATED |

---

## 4. ROLLBACK PLAN

### Pre-Migration Backup

**Before ANY changes**:
1. Create git branch: `backup/pre-ui-migration`
2. Commit all current work
3. Tag commit: `v-pre-migration`

```bash
git checkout -b backup/pre-ui-migration
git add -A
git commit -m "backup: pre-UI migration snapshot"
git tag v-pre-migration
git push -u origin backup/pre-ui-migration
```

### Component-Level Rollback

Each component will be migrated individually with git commits:

**Migration Pattern**:
```
1. Commit: "ui: update Button component with kidtrek styles"
2. Test: Verify all existing functionality works
3. If broken: git revert HEAD
4. If works: Continue to next component
```

### Full Rollback Procedure

If migration causes critical issues:

**Option 1: Revert Individual Commits**
```bash
git log --oneline --grep="ui:"  # Find UI migration commits
git revert <commit-hash>        # Revert specific changes
```

**Option 2: Full Branch Rollback**
```bash
git checkout claude/ruby-routines-sessions-011CV4GwqXx1vqtDLPiBi6Ws
git reset --hard v-pre-migration
git push --force-with-lease
```

**Option 3: Cherry-Pick Good Changes**
```bash
git checkout v-pre-migration -b recovery
git cherry-pick <working-commit-1>
git cherry-pick <working-commit-2>
```

### Verification Checklist (Before Each Commit)

After each component migration, verify:

- [ ] All existing buttons still trigger correct mutations
- [ ] All forms still submit with correct validation
- [ ] All lists still load data from tRPC
- [ ] All deletions still soft-delete (status change)
- [ ] Tier limits still enforce correctly
- [ ] "Me" person still cannot be deleted
- [ ] "Daily Routine" still cannot be renamed/deleted
- [ ] Task completion still tracks correctly
- [ ] Undo still works for SIMPLE tasks (5-min window)
- [ ] Progress bars still calculate correctly
- [ ] Toast notifications still show on success/error

### Emergency Stop Criteria

**STOP migration immediately if**:
1. Any tRPC endpoint returns unexpected errors
2. Data is being deleted (hard delete instead of soft)
3. Tier limits stop working
4. Task completions stop tracking
5. Auth flow breaks
6. Protected entities (Me, Daily Routine) can be deleted
7. Any 500 errors in production

---

## 5. MIGRATION SEQUENCE

### Phase 1: Core UI Components (Day 1)
1. ✅ Backup branch created
2. Update Button component
3. Update Card component
4. Update Input component
5. Update Label component
6. Update Dialog component
7. Test all forms still work
8. Commit: "ui: migrate core components from kidtrek"

### Phase 2: List Components (Day 1)
1. Update PersonList layout
2. Update RoutineList layout
3. Update TaskList layout
4. Test all lists load data correctly
5. Commit: "ui: migrate list layouts from kidtrek"

### Phase 3: Card Components (Day 2)
1. Update PersonCard styling
2. Update RoutineCard styling
3. Update TaskItem styling
4. Test all interactions work (click, edit, delete)
5. Commit: "ui: migrate card components from kidtrek"

### Phase 4: Form Components (Day 2)
1. Update PersonForm with color/emoji picker
2. Update RoutineForm styling
3. Update TaskForm with icon picker
4. Test all form submissions work
5. Test tier limits still enforce
6. Commit: "ui: migrate form components from kidtrek"

### Phase 5: Page Layouts (Day 3)
1. Update dashboard layouts
2. Update auth page layouts
3. Update detail page layouts
4. Test routing still works
5. Test auth guards still protect pages
6. Commit: "ui: migrate page layouts from kidtrek"

### Phase 6: Final Polish (Day 3)
1. Add Toast component
2. Add Empty states
3. Add Loading skeletons
4. Test complete user flows
5. Commit: "ui: add kidtrek interactive patterns"

---

## 6. TESTING STRATEGY

### Automated Tests (Run After Each Phase)
```bash
npm run type-check  # TypeScript compilation
npm run lint        # ESLint checks
npm run build       # Next.js build (catches runtime errors)
```

### Manual Tests (Run After Each Phase)

**Auth Flow**:
- [ ] Sign up new user → "Me" person created
- [ ] Sign in existing user → session restored
- [ ] Sign out → redirects to login

**Person Management**:
- [ ] Create person → tier limit enforced
- [ ] Edit person → color/emoji picker works
- [ ] Delete person → soft delete (status=INACTIVE)
- [ ] Restore person → status back to ACTIVE
- [ ] "Me" person cannot be deleted

**Routine Management**:
- [ ] Create routine → tier limit enforced
- [ ] Edit routine → visibility rules apply
- [ ] Delete routine → soft delete
- [ ] "Daily Routine" cannot be renamed/deleted
- [ ] Copy routine → creates duplicates with tasks

**Task Management**:
- [ ] Create SIMPLE task → tier limit enforced
- [ ] Create PROGRESS task → targetValue required
- [ ] Complete SIMPLE task → undo button appears
- [ ] Undo within 5 mins → completion deleted
- [ ] Complete PROGRESS task → aggregation updates
- [ ] Reorder tasks → order field updates

---

## 7. RISK MITIGATION

### Low Risk Areas (Safe to Migrate)
- ✅ Color palette (no logic impact)
- ✅ Typography (no logic impact)
- ✅ Spacing (no logic impact)
- ✅ Border radius (no logic impact)
- ✅ Shadow effects (no logic impact)
- ✅ Hover states (no logic impact)

### Medium Risk Areas (Test Thoroughly)
- ⚠️ Form layouts (ensure inputs still connect to state)
- ⚠️ Button variants (ensure onClick handlers preserved)
- ⚠️ Dialog structure (ensure callbacks work)
- ⚠️ Card layouts (ensure data binding preserved)

### High Risk Areas (Verify Carefully)
- 🔴 Icon/Emoji pickers (ensure selection state works)
- 🔴 Progress bars (ensure calculation logic preserved)
- 🔴 Undo timers (ensure countdown logic works)
- 🔴 Live previews (ensure data binding works)

### Mitigation Strategies
1. **Incremental commits**: One component at a time
2. **Feature flags**: Add `USE_NEW_UI` flag if needed
3. **Parallel branches**: Keep old UI accessible
4. **Staged rollout**: Test on dev before production

---

## 8. SUCCESS CRITERIA

Migration is successful when:

1. ✅ All existing tRPC endpoints return correct data
2. ✅ All forms submit with correct validation
3. ✅ All mutations trigger correct invalidations
4. ✅ All tier limits enforce correctly
5. ✅ All protected entities remain protected
6. ✅ All soft deletes work (no hard deletes)
7. ✅ All task completion tracking works
8. ✅ All undo functionality works
9. ✅ All reset period calculations work
10. ✅ All visibility rules apply correctly
11. ✅ UI looks consistent with KidTrek design system
12. ✅ No TypeScript errors
13. ✅ No console errors
14. ✅ No broken links/routes
15. ✅ All tests pass

---

## 9. APPROVAL REQUIRED

**Before proceeding, please confirm**:

1. ✅ You understand ONLY visual UI will be migrated
2. ✅ You understand ALL business logic will be preserved
3. ✅ You approve the rollback plan
4. ✅ You approve the testing strategy
5. ✅ You approve the migration sequence

**To approve**: Reply "APPROVED" to begin migration
**To modify**: Specify changes needed
**To cancel**: Reply "CANCEL"

---

## 10. QUESTIONS & CONCERNS

### Q: Will this break any existing functionality?
**A**: No. We're only changing CSS/layout, not logic. All tRPC calls, validations, and state management remain identical.

### Q: Can we rollback if something goes wrong?
**A**: Yes. We create a backup branch first and commit incrementally. Any issue can be reverted immediately.

### Q: How long will this take?
**A**: Estimated 3 days with thorough testing. Can pause/resume at any phase boundary.

### Q: Will users notice during migration?
**A**: No. Changes happen in development branch. Only deployed when fully tested and approved.

### Q: What if kidtrek has features Ruby Routines doesn't?
**A**: We only migrate UI for features that exist in Ruby Routines. No new features added.

---

**END OF MIGRATION PLAN**

Last Updated: November 13, 2024
Version: 1.0
