# Changelog - November 27, 2025

## Bug Fixes

### Nested Button HTML Violation in Collapsible Triggers
**Commit:** `237e17f`

Removed `asChild` prop from `CollapsibleTrigger` components that were wrapping native `<button>` or `<Button>` elements. This was causing the HTML validation error "button cannot be a descendant of button".

`CollapsibleTrigger` already renders as a button, so using `asChild` with another button creates invalid nested buttons.

**Files changed:**
- `components/kiosk/person-kiosk-code-manager.tsx`
- `components/person/person-checkin-modal.tsx`

---

### Routine Filtering Now Includes Group Membership
**Commit:** `353b040`

The `routine.list` query now checks both direct person assignments and group membership when filtering by `personId`. This fixes connection settings where routine selection wasn't working for people assigned to routines through groups.

**Files changed:**
- `lib/trpc/routers/routine.ts`
