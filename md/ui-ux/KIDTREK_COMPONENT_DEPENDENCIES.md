# KidTrek Component Dependencies & Migration Guide

## Component Dependency Tree

```
┌─ PROVIDERS (Root Level)
│  ├─ TRPCProvider (app/layout.tsx)
│  └─ ToasterProvider (app/layout.tsx)
│
├─ UI BASE COMPONENTS (foundational - no dependencies except React)
│  ├─ Button (components/ui/button.tsx)
│  ├─ Card (components/ui/card.tsx)
│  ├─ Dialog (components/ui/dialog.tsx)
│  ├─ Input (components/ui/input.tsx)
│  ├─ Label (components/ui/label.tsx)
│  ├─ Form (components/ui/form.tsx) → depends on Label
│  └─ Toast (components/ui/toast.tsx) → provides useToast hook
│
├─ FEATURE COMPONENTS
│  │
│  ├─ PERSON COMPONENTS
│  │  ├─ PersonCard (components/person/person-card.tsx)
│  │  │  └─ depends on: Button, useToast
│  │  ├─ PersonList (components/person/person-list.tsx)
│  │  │  └─ depends on: PersonCard, Button, PersonForm, RestorePersonDialog
│  │  ├─ PersonForm (components/person/person-form.tsx)
│  │  │  └─ depends on: Dialog, Button, Input, Label, useToast
│  │  └─ RestorePersonDialog (components/person/restore-person-dialog.tsx)
│  │     └─ depends on: Dialog, Button, useToast
│  │
│  ├─ ROUTINE COMPONENTS
│  │  ├─ RoutineCard (components/routine/routine-card.tsx)
│  │  │  └─ depends on: Button, useToast
│  │  ├─ RoutineList (components/routine/routine-list.tsx)
│  │  │  └─ depends on: RoutineCard, Button, RoutineForm
│  │  └─ RoutineForm (components/routine/routine-form.tsx)
│  │     └─ depends on: Dialog, Button, Input, Label, useToast
│  │
│  └─ TASK COMPONENTS
│     ├─ TaskItem (components/task/task-item.tsx)
│     │  └─ depends on: Button, Input, useToast, TaskForm, TaskType enum
│     ├─ TaskList (components/task/task-list.tsx)
│     │  └─ depends on: TaskItem, Button, TaskForm, useToast
│     └─ TaskForm (components/task/task-form.tsx)
│        └─ depends on: Dialog, Button, Input, Label, useToast, TaskType enum
│
└─ PAGE LAYOUTS
   ├─ Root Layout (app/layout.tsx)
   │  └─ depends on: TRPCProvider, ToasterProvider, globals.css
   ├─ Auth Layout (app/(auth)/layout.tsx)
   │  └─ uses: Tailwind utilities only
   ├─ Login Page (app/(auth)/login/page.tsx)
   │  └─ depends on: Button, Input, Label, useToast, trpc.auth.signIn
   ├─ Signup Page (app/(auth)/signup/page.tsx)
   │  └─ depends on: Button, Input, Label, useToast, trpc.auth.signUp
   ├─ Parent Dashboard (app/(dashboard)/parent/page.tsx)
   │  └─ depends on: PersonList, trpc.auth.getSession
   ├─ Person Detail (app/(dashboard)/parent/[personId]/page.tsx)
   │  └─ depends on: Button, RoutineList, trpc (person.getById, auth.getSession)
   └─ Routine Detail (app/(dashboard)/parent/[personId]/[routineId]/page.tsx)
      └─ depends on: Button, TaskList, trpc (person.getById, routine.getById)
```

---

## Migration Phases

### Phase 1: Foundation (Core UI Components)
**Priority**: CRITICAL - These are the building blocks
**Estimated Effort**: 2-3 days
**Dependencies**: React only

1. **Button** - 5 variants, 3 sizes
   - No dependencies
   - Test all variants and sizes
   - Verify touch targets (44px minimum)

2. **Card** - Base + subcomponents
   - No dependencies
   - Test nesting and layout
   - Verify shadows and radius

3. **Input** - Text input with all states
   - No dependencies
   - Test focus, disabled, placeholder states
   - Verify responsive sizing

4. **Label** - Form labels
   - No dependencies
   - Basic styling component

5. **Dialog** - Modal system
   - No dependencies
   - Complex: Escape key handling, scroll lock, focus management
   - Test all subcomponents

### Phase 2: Forms (Form Components)
**Priority**: HIGH - Required for all input features
**Estimated Effort**: 2-3 days
**Dependencies**: Phase 1 components

6. **Form** - Context-based form system
   - Depends on: Label
   - Provides error handling and field management
   - Test validation display

7. **Toast** - Notification system
   - No component dependencies
   - Provides `useToast()` hook
   - Test auto-dismiss, variants, positioning

### Phase 3: Feature Components (Vertical Slices)
**Priority**: HIGH - Business logic components
**Estimated Effort**: 5-7 days per vertical
**Dependencies**: Phase 1 + Phase 2

#### Vertical 1: Person Management
8. **PersonForm**
   - Depends on: Dialog, Button, Input, Label, useToast
   - Unique feature: Avatar customization (32 colors + 99 emojis)
   - Estimated: 1-2 days

9. **PersonCard**
   - Depends on: Button, useToast, PersonForm
   - Estimated: 0.5 days

10. **PersonList**
    - Depends on: PersonCard, Button, PersonForm, RestorePersonDialog
    - Estimated: 0.5 days

11. **RestorePersonDialog**
    - Depends on: Dialog, Button, useToast
    - Estimated: 0.5 days

#### Vertical 2: Routine Management
12. **RoutineForm**
    - Depends on: Dialog, Button, Input, Label, useToast
    - Estimated: 1 day

13. **RoutineCard**
    - Depends on: Button, useToast, RoutineForm
    - Estimated: 0.5 days

14. **RoutineList**
    - Depends on: RoutineCard, Button, RoutineForm
    - Estimated: 0.5 days

#### Vertical 3: Task Management
15. **TaskForm**
    - Depends on: Dialog, Button, Input, Label, useToast
    - Unique feature: Icon picker (40 emojis)
    - Estimated: 1-2 days

16. **TaskItem**
    - Depends on: Button, Input, useToast, TaskForm
    - Complex: 3 task types with different UIs
    - Estimated: 1-2 days

17. **TaskList**
    - Depends on: TaskItem, Button, TaskForm, useToast
    - Features: Reordering with up/down buttons
    - Estimated: 1 day

### Phase 4: Layout Patterns
**Priority**: MEDIUM
**Estimated Effort**: 2-3 days
**Dependencies**: All feature components

18. **Auth Layout**
    - Simple: Centered form container
    - Estimated: 0.5 days

19. **Auth Pages** (Login/Signup)
    - Depends on: Button, Input, Label
    - Estimated: 1 day

20. **Dashboard Layout & Pages**
    - Depends on: PersonList, RoutineList, TaskList
    - Estimated: 1 day

---

## Recommended Migration Sequence

### Week 1: Foundation
```
Day 1: Button, Card, Input, Label
Day 2: Dialog (complex modal system)
Day 3: Form, Toast (hook-based)
└─ CHECKPOINT: All core UI working
```

### Week 2: Feature Components - Person
```
Day 1: PersonForm (avatar picker is complex)
Day 1-2: PersonCard, PersonList, RestorePersonDialog
└─ CHECKPOINT: Full person management working
```

### Week 2-3: Feature Components - Routine
```
Day 1: RoutineForm
Day 1: RoutineCard, RoutineList
└─ CHECKPOINT: Routine management working
```

### Week 3: Feature Components - Task
```
Day 1-2: TaskForm (icon picker, type-specific fields)
Day 1-2: TaskItem (3 different UIs)
Day 1: TaskList (reordering)
└─ CHECKPOINT: Task management working
```

### Week 4: Layout & Pages
```
Day 1: Auth layout and pages
Day 1: Dashboard layout and pages
Day 1: Testing and refinement
└─ CHECKPOINT: Full application working
```

---

## Component Import Pattern

### UI Base Components (no external deps except React)
```typescript
// components/ui/button.tsx
import * as React from "react"
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
```

### Feature Components (depend on UI + hooks)
```typescript
// components/person/person-card.tsx
'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
```

### Forms (depend on Dialog + Form)
```typescript
// components/person/person-form.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
```

---

## Critical Implementation Details

### 1. Button Component
- **Touch Targets**: Must be 44px minimum (44px × 44px for sizes sm/md, 64px × 64px for lg)
- **Focus Ring**: ring-2 ring-offset-2 required for accessibility
- **Variants**: Each has specific hover/focus colors that must match variant base color
- **Disabled State**: Must prevent interactions (pointer-events-none) and visual feedback (opacity-50)

### 2. Dialog Component
- **Escape Key**: Must close on Escape key press
- **Body Scroll**: Must lock document.body overflow when open
- **Overlay Click**: Clicking outside content should close
- **Z-index**: Content (z-[60]) must be higher than overlay (z-50)
- **Scrolling**: Content should be scrollable if exceeds 90vh height

### 3. Avatar System (PersonForm)
- **Colors**: 32 distinct pastel colors - store selection as JSON
- **Emojis**: 99 emoji options with searchable grid
- **Visual Feedback**: Scale and ring effects on selection
- **Preview**: Show live preview of final avatar in form

### 4. Task Types
- **Simple**: Single toggle button, 5-minute undo window
- **Multiple Check-in**: Counter + check-in button
- **Progress**: Number input + unit display + progress bar

### 5. Responsive Grid
- **1 column**: Mobile (< 640px)
- **2 columns**: Tablet (640px - 1024px)
- **3 columns**: Desktop (> 1024px)
- All with `gap-6` spacing

---

## Testing Checklist

### Unit Component Tests
- [ ] Button all variants render correctly
- [ ] Button all sizes meet touch target requirements
- [ ] Card shadows and padding correct
- [ ] Dialog opens/closes on escape and overlay click
- [ ] Input focus states visible
- [ ] Form validation messages display
- [ ] Toast auto-dismisses after 5 seconds

### Integration Tests
- [ ] PersonForm avatar picker works (color + emoji)
- [ ] PersonCard displays with styled avatar
- [ ] PersonList grid responsive (1/2/3 cols)
- [ ] RoutineForm fields populate on edit
- [ ] TaskForm shows different UI for each type
- [ ] TaskItem undo timer counts down
- [ ] TaskList reordering works

### Visual Tests
- [ ] All colors match hex values
- [ ] All font sizes match specifications
- [ ] Spacing follows 4px grid
- [ ] Shadows are consistent (md/lg)
- [ ] Transitions are smooth (200-300ms)
- [ ] Responsive breakpoints work on actual devices

### Accessibility Tests
- [ ] Focus rings visible on all interactive elements
- [ ] Form labels connected with htmlFor
- [ ] Touch targets at least 44px × 44px
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works

---

## File Size Estimates

| Component | LOC | Est. Size |
|-----------|-----|-----------|
| Button | 40 | 1KB |
| Card | 60 | 2KB |
| Dialog | 150 | 5KB |
| Input | 30 | 1KB |
| Label | 20 | 1KB |
| Form | 120 | 4KB |
| Toast | 150 | 5KB |
| PersonForm | 320 | 10KB |
| PersonCard | 120 | 4KB |
| PersonList | 80 | 3KB |
| RoutineForm | 220 | 7KB |
| RoutineCard | 140 | 5KB |
| TaskForm | 270 | 9KB |
| TaskItem | 280 | 9KB |
| **Total** | **~2100** | **~66KB** |

---

## Dependencies to Install

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "14.2.14",
    "lucide-react": "^0.553.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.13",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.20"
  }
}
```

No additional UI library dependencies needed - all components are built from scratch!

---

## Common Pitfalls to Avoid

1. **Touch Targets**: Don't forget the 44px minimum - it's critical for mobile
2. **Focus Rings**: Don't hide with outline-none without replacing with ring
3. **Modal Scroll Lock**: Body overflow must be reset when modal closes
4. **Emoji Display**: Use text emojis directly, don't try to process them
5. **Gradient Timing**: Keep transitions to 200-300ms, not longer
6. **Color Opacity**: Avatar colors use `color + '20'` for 20% opacity background
7. **Disabled States**: Both visual (opacity) and functional (disabled attribute)
8. **Z-index Management**: Be consistent (50, 60, etc.) to avoid stacking issues
9. **Responsive Padding**: Different padding for mobile vs desktop
10. **Loading States**: Always update button text and disable during submission

---

## Quick Migration Checklist

### Before Starting
- [ ] Node 18+, npm/yarn ready
- [ ] Next.js project initialized
- [ ] Tailwind CSS configured
- [ ] lucide-react installed
- [ ] globals.css with Tailwind directives

### Phase 1 Sign-off
- [ ] All 7 UI base components working
- [ ] All components exported properly
- [ ] Touch targets verified on mobile
- [ ] Focus rings visible

### Phase 2 Sign-off
- [ ] Form component with validation
- [ ] Toast notifications working (5s auto-dismiss)
- [ ] useToast hook available globally

### Phase 3 Sign-off
- [ ] Person CRUD fully functional
- [ ] Avatar picker with 32 colors + 99 emojis
- [ ] Routine CRUD fully functional
- [ ] Task CRUD with 3 types
- [ ] All empty states present

### Phase 4 Sign-off
- [ ] Auth layout and pages working
- [ ] Dashboard layout responsive
- [ ] All pages load without errors
- [ ] Full end-to-end flow working

