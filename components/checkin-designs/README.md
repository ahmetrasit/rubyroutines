# Check-in UI Designs

This directory contains 6 significantly different check-in UI designs optimized for both kids and seniors, split between dashboard (smartphone) and kiosk (tablet) interfaces.

## Preview

Visit `/checkin-preview` to see all 6 designs in action with interactive demos.

## Dashboard Check-in Designs (Smartphone)

### Design 1: Card-based Swipeable Layout
**File:** `dashboard/design1-card-swipe.tsx`

**Key Features:**
- Large, swipeable cards optimized for one-handed use
- High contrast colors for seniors with visual impairments
- Big emoji and visual feedback for kids
- Celebration animations on task completion (confetti, emojis)
- Large touch targets (minimum 56px)
- Progress bar showing overall completion
- Goals summary in footer
- One task at a time focus to reduce cognitive load

**Best For:** Sequential task completion, young children, seniors who prefer simple interfaces

---

### Design 2: Compact List with Color Indicators
**File:** `dashboard/design2-compact-list.tsx`

**Key Features:**
- Efficient use of screen space for quick check-ins
- Color-coded task status (red/yellow/green traffic light system)
- Quick-tap completion for simple tasks
- Inline progress tracking for PROGRESS tasks
- Sticky header with progress overview
- Category grouping by task type
- Expandable sections to manage screen real estate
- Footer with quick statistics

**Best For:** Power users, quick daily check-ins, busy parents, efficient task management

---

### Design 3: Gamified Celebration Design
**File:** `dashboard/design3-gamified.tsx`

**Key Features:**
- Game-like interface with achievements and rewards
- Level/XP system for motivation (Level up every 3 tasks)
- Animated star/coin/trophy rewards on completion
- Confetti animations for celebrations
- Bright gradient colors optimized for kids
- Streak tracking visualization
- Achievement badges and progress indicators
- Victory screen when all tasks complete

**Best For:** Kids (ages 5-12), motivation and engagement, making chores fun

---

## Kiosk Check-in Designs (Tablet)

### Kiosk Design 1: Grid-based Touchable Tiles
**File:** `kiosk/design1-grid-tiles.tsx`

**Key Features:**
- 2-column grid layout for tablet screens
- Extra large touch targets (120px+ height)
- Color-coded task states with clear visual feedback
- Big emoji icons for easy recognition
- Celebration overlay when all tasks complete
- Separated completed and incomplete sections
- Visual progress bar at top
- Goals section with achievement tracking

**Best For:** Classroom settings, family kiosk mode, shared tablet devices

---

### Kiosk Design 2: Split-screen Goals and Tasks
**File:** `kiosk/design2-split-screen.tsx`

**Key Features:**
- Two-panel layout: Goals (40%) on left, Tasks (60%) on right
- Real-time goal progress visualization
- Shows immediate impact of task completion on goals
- Large touch-friendly task cards
- Clear visual separation of concerns
- Progress-focused design philosophy
- Achievement celebrations for completed goals
- Expandable progress input for PROGRESS tasks

**Best For:** Goal-oriented users, teachers tracking student progress, motivation through visible progress

---

### Kiosk Design 3: Timeline Vertical Flow
**File:** `kiosk/design3-timeline-flow.tsx`

**Key Features:**
- Vertical timeline showing clear progression through tasks
- Connected dots showing journey from start to finish
- One task at a time focus (current task highlighted)
- Past/present/future visual states
- Milestone celebrations every 3 tasks
- Step numbers for easy tracking
- Extra large touch areas and text
- Victory screen at completion

**Best For:** Sequential workflows, seniors who prefer linear progression, educational settings, step-by-step guidance

---

## Design Considerations

### For Kids (Ages 5-12)
- ✅ Large emojis and colorful visuals
- ✅ Celebration animations and rewards
- ✅ Gamification elements (levels, stars, trophies)
- ✅ Simple, intuitive interactions
- ✅ Immediate visual feedback
- ✅ Fun gradient backgrounds
- ✅ Achievement tracking

### For Seniors (Ages 60+)
- ✅ High contrast colors for readability
- ✅ Large text (minimum 16px, often 20px+)
- ✅ Extra large touch targets (56px+ mobile, 120px+ tablet)
- ✅ Clear visual feedback on actions
- ✅ Simple navigation patterns
- ✅ Reduced cognitive load
- ✅ No small or precise interactions required

### Task Type Support
All designs support three task types:
1. **SIMPLE** - One-time completion tasks (e.g., "Brush teeth")
2. **MULTIPLE_CHECKIN** - Tasks that can be done multiple times (e.g., "Drink water" - up to 9 times)
3. **PROGRESS** - Tasks with numeric tracking (e.g., "Read pages" - track number of pages)

### Responsive Design
- **Dashboard designs**: Optimized for 375px-428px width (smartphone)
- **Kiosk designs**: Optimized for 768px-1024px width (tablet)
- All designs use rem/em units and flexible layouts
- Touch targets meet WCAG AAA standards (minimum 44x44px)

## Technology Stack
- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- Lucide React icons
- CSS animations and transitions

## Usage Example

```tsx
import { Design1CardSwipe } from '@/components/checkin-designs/dashboard/design1-card-swipe';

function MyCheckinPage() {
  const [tasks, setTasks] = useState(myTasks);

  const handleComplete = (taskId: string, value?: string) => {
    // Your completion logic
  };

  return (
    <Design1CardSwipe
      personName="Alex"
      tasks={tasks}
      goals={myGoals}
      onComplete={handleComplete}
      onClose={() => router.back()}
      isPending={false}
    />
  );
}
```

## Performance Considerations
- Animations use CSS transforms (GPU-accelerated)
- Efficient re-renders with React best practices
- Optimized touch event handlers
- Lazy loading of celebration animations
- Minimal JavaScript bundle size

## Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support (where applicable)
- High contrast color ratios (WCAG AA compliant)
- Screen reader friendly
- Touch target sizes meet accessibility standards

## Future Enhancements
- [ ] Sound effects for celebrations (optional, can be toggled)
- [ ] Haptic feedback on mobile devices
- [ ] Dark mode variants
- [ ] Additional language support with RTL layout
- [ ] Customizable color themes per person
- [ ] Voice command support for hands-free operation
