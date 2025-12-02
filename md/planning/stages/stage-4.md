# Stage 4: Kiosk Mode

**Duration:** 3-4 days  
**Token Estimate:** 70K tokens ($1.05)  
**Prerequisites:** Stage 3 completed (goals and smart routines working)

---

## SESSION PROMPT (Copy-Paste This)

```
You are building Ruby Routines Stage 4: Kiosk Mode.

CONTEXT:
- Project: Ruby Routines (routine management PWA)
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Stage Goal: Implement kiosk mode (code-based, authentication-free access)

COMPLETED IN PREVIOUS STAGES:
- Auth system working
- Core CRUD (persons, groups, routines, tasks)
- Goals system working
- Smart routines with conditions
- Task completion tracking
- Dashboards (parent/teacher)

CURRENT STAGE OBJECTIVES:
1. Code generation system (2000-word safe list)
2. Kiosk authentication (code-based)
3. Kiosk UI (child, adult, group modes)
4. Task completion in kiosk
5. Real-time updates (Supabase Realtime)
6. Code validation (5-min intervals)
7. Offline detection (1-hour timeout)
8. Session management
9. Code regeneration

KIOSK MODE REQUIREMENTS:

**Code Types:**
1. Child kiosk code (single child access)
2. Adult kiosk code (single/multiple adults)
3. Classroom kiosk code (all students)
4. Family kiosk code (all kids)

**Code Format:**
- 4 words: [context]-[random1]-[random2]-[random3]
- Example: emma-sunset-river-mountain
- Globally unique
- 90-day expiration (default, user-configurable)
- Safe word list (2000 child-friendly words)

**Kiosk Layout (Three Sections):**
1. Group Section (visible if group code)
   - List of all members
   - Click to select person
2. Person Section (auto-populated or selected)
   - Shows selected person's info
   - Resets after timeout
3. Tasks Section (reactive to person selection)
   - All visible routines
   - All tasks within routines
   - Task ordering (goal-linked top, smart bottom)
   - Real-time updates

**Session Management:**
- Inactivity timeout: 5 minutes (admin-configurable)
- Individual codes: Return to default state
- Group codes: Clear person + task selection
- Manual exit button
- Code validation every 5 minutes
- Offline timeout: 1 hour (12 failed checks)

**Code Validation:**
- Check every 5 minutes (not configurable)
- Verify: Code active, not expired, not deactivated
- If invalid: Immediate logout
- If offline 1 hour: Auto-deactivate kiosk

**Real-Time Updates:**
- Task completion syncs across devices
- Smart task visibility updates
- Goal progress updates
- Condition evaluation triggers

**Code Regeneration:**
- Teacher/parent regenerates code
- Old code immediately deactivated
- Active sessions terminated
- New code generated (unique)
- Warning shown before regeneration

SAFE WORD LIST:
Must generate 2000 child-safe words across categories:
- Animals (200 words)
- Colors (100 words)
- Nature (300 words)
- Food (200 words)
- Objects (300 words)
- Actions (300 words)
- Emotions (100 words)
- Places (200 words)
- Time (100 words)
- Qualities (200 words)

TESTING REQUIREMENTS:
- Code generation (uniqueness)
- Code validation intervals
- Offline timeout behavior
- Real-time updates
- Session management
- Code regeneration

BEGIN IMPLEMENTATION:
Start with code generation system (safe word list).
Then kiosk authentication.
Then kiosk UI (three-section layout).
Then session management and validation.
Test thoroughly with multiple devices.
```

---

## Deliverables Checklist

```
CODE GENERATION:
□ Safe word list (2000 words)
□ Code generator (4-word format)
□ Global uniqueness check
□ Expiration tracking
□ Code types (child, adult, group)

KIOSK UI:
□ Three-section layout
□ Group section (person list)
□ Person section (selected person)
□ Tasks section (routines + tasks)
□ Task completion UI
□ Real-time updates

SESSION MANAGEMENT:
□ Inactivity timeout (5 min)
□ Manual exit
□ Code validation (5-min intervals)
□ Offline detection (1-hour timeout)
□ Session reset logic

CODE MANAGEMENT:
□ Code regeneration
□ Old code deactivation
□ Active session termination
□ Warning dialog

REAL-TIME:
□ Task completion sync
□ Smart task visibility updates
□ Goal progress updates
□ Condition evaluation
```

---

## Next Stage

After completing Stage 4, proceed to:
**[Stage 5: Co-Parent/Teacher + School Mode](stage-5.md)**
