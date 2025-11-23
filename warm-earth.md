# Warm Earth Design System
## Complete UX & UI Specification for Check-in Screens

**Version:** 1.0
**Last Updated:** 2025-11-23
**Design Philosophy:** Calming, accessible, and child/senior-friendly with warm gray and teal tones

---

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Dashboard Mode (Mobile/Smartphone)](#dashboard-mode)
4. [Kiosk Mode (Tablet)](#kiosk-mode)
5. [Component Specifications](#component-specifications)
6. [Interaction Patterns](#interaction-patterns)
7. [Accessibility Guidelines](#accessibility-guidelines)

---

## Color Palette

### Primary Colors

#### Incomplete State (Warm Gray)
```css
--warm-incomplete-primary: #90A4AE;     /* Blue Gray 300 */
--warm-incomplete-secondary: #78909C;   /* Blue Gray 400 */
--warm-incomplete-bg: rgba(120, 144, 156, 0.08);
```

#### Complete State (Teal)
```css
--warm-complete-primary: #4DB6AC;       /* Teal 300 */
--warm-complete-secondary: #26A69A;     /* Teal 400 */
--warm-complete-bg: #E0F2F1;            /* Teal 50 */
```

#### Progress/Goals (Blue)
```css
--warm-progress-primary: #42A5F5;       /* Blue 400 */
--warm-progress-secondary: #1976D2;     /* Blue 700 */
--warm-progress-bg: rgba(144, 202, 249, 0.08);
```

#### Neutrals
```css
--warm-background: #EFEBE9;             /* Brown 50 - page background */
--warm-card-bg: #FFFFFF;                /* White - card backgrounds */
--warm-text-primary: #37474F;           /* Blue Gray 800 - main text */
--warm-text-secondary: #607D8B;         /* Blue Gray 500 - secondary text */
--warm-border-light: #D7CCC8;           /* Brown 200 - borders */
```

### Color Usage Guidelines

1. **Incomplete Tasks:** Light gray background (#78909C at 8% opacity) with gray text
2. **Completed Tasks:** Teal background (#E0F2F1 solid) with teal text
3. **Progress Indicators:** Blue backgrounds and gradients for goal progress
4. **Text Contrast:** Always maintain WCAG AA contrast ratios (4.5:1 minimum)

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
```

### Dashboard Mode (Mobile/Smartphone)

#### Headers
- **Main Title:** 26px, weight 700, color #1F2937
- **Section Titles:** 12px, weight 700, uppercase, letter-spacing 0.5px, color #374151
- **Completed Count:** 15px, weight 600, color #26A69A
- **Subtitle:** 14px, color #6B7280

#### Task Text
- **Task Name:** 16px, weight 600, line-height 1.3
  - Incomplete: #78909C
  - Complete: #26A69A
- **Task Description:** 13px, line-height 1.3
  - Incomplete: #90A4AE
  - Complete: #4DB6AC

#### Goal Progress
- **Goal Badge:** 12px, weight 600, color #1976D2
- **Goal Percentage:** 11px, weight 700, color #42A5F5

#### Progress Cards
- **Progress Name:** 15px, weight 600, color #1976D2
- **Progress Description:** 13px, color #42A5F5
- **Progress Value:** 13px, weight 600, color #42A5F5

### Kiosk Mode (Tablet - 2x Larger)

#### Headers
- **Main Title:** 36px, weight 700, color #37474F
- **Section Titles:** 32px, weight 700, uppercase

#### Task Text
- **Task Name:** 28px, weight 600
- **Task Description:** 26px, line-height 1.3

#### All Other Elements
- Scale by 2x from dashboard sizes
- Maintain proportional spacing

---

## Dashboard Mode

### Device Specifications
- **Target Devices:** Smartphones (iPhone, Android phones)
- **Viewport Width:** 375px - 420px
- **Orientation:** Portrait
- **Container Max Width:** 420px

### Layout Structure

#### Modal Container
```css
max-width: 420px;
height: auto;
max-height: 90vh;
background: white;
border-radius: 24px;
box-shadow: 0 20px 60px rgba(0,0,0,0.1);
```

#### Header
```css
padding: 24px;
border-bottom: 1px solid #ECEFF1;
background: linear-gradient(135deg, rgba(77, 182, 172, 0.05), rgba(38, 166, 154, 0.05));
```

**Header Content:**
1. Person name + "Check-in" (26px, weight 700)
2. Completed count (if > 0): "✨ X tasks done today" (15px, weight 600, teal)
3. Encouraging subtitle: "You're doing great!" (14px, gray)
4. Close button (top-right, ghost variant)

#### Content Area
```css
padding: 20px;
background: white;
overflow-y: auto;
max-height: calc(90vh - 120px);
```

**Content Structure:**
1. Section title (uppercase, 12px)
2. Task cards (spacing: 10px between cards)
3. Sections separated by 20px vertical space

### Task Card Types

#### 1. Simple Task Cards (Checklist)

**Visual Pattern:** A3 Card Layout
```css
border-radius: 16px;
padding: 14px 16px;
margin-bottom: 10px;
display: flex;
align-items: flex-start;
gap: 12px;
cursor: pointer;
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

**States:**
- **Incomplete:** `background: rgba(120, 144, 156, 0.08);`
- **Complete:** `background: #E0F2F1;`

**Interaction:**
- Tap to toggle completion
- Active state: `transform: scale(0.98);`

**Components:**

1. **C4 Rotating Square (12px × 12px)**
   - Position: Left side, `margin-top: 4px` (align with text baseline)
   - Incomplete: Empty square with 2.5px border (#90A4AE)
   - Complete: Filled square (#4DB6AC) with `transform: rotate(45deg);`
   - Transition: `all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`

2. **Task Content (flex: 1)**
   - Task name (16px, weight 600)
   - Task description (13px, below name, 2px margin-top)
   - Inline goal progress (if linked to goal)

3. **Inline Goal Progress Bar**
   ```
   [🎯 Goal Name] [========75%========] 75%
   ```
   - Margin-top: 8px
   - Layout: `display: flex; gap: 8px; align-items: center;`
   - Badge: padding 2px 8px, border-radius 8px, blue background
   - Bar container: flex: 1, height 4px, light blue background
   - Bar fill: linear-gradient(90deg, #42A5F5 → #1976D2), width based on percentage
   - Percentage: 11px, weight 700, min-width 32px, right-aligned

#### 2. Multi Check-in Cards

**Visual Pattern:** Progress Card
```css
background: rgba(144, 202, 249, 0.08);
border-radius: 14px;
padding: 14px 16px;
display: flex;
align-items: center;
gap: 12px;
```

**Components:**
1. Emoji indicator (20px, flex-shrink: 0) - e.g., ✔️
2. Content area (flex: 1)
   - Name (15px, weight 600, blue)
   - Description (13px, blue, optional)
3. +1 Button (white background, blue border, 6px 14px padding)
4. Count display (13px, weight 600, blue, min-width 70px, right-aligned) - e.g., "5x"

#### 3. Progress Task Cards

**Visual Pattern:** Same as Multi Check-in
```css
background: rgba(144, 202, 249, 0.08);
border-radius: 14px;
padding: 14px 16px;
display: flex;
align-items: center;
gap: 12px;
```

**Components:**
1. Emoji indicator (20px) - 📊
2. Content area (flex: 1)
   - Name (15px, weight 600, blue)
   - Description (13px, blue, optional)
3. Number input (70px width, 6px 10px padding, center-aligned text)
4. "Add" button (white background, blue border)
5. Value display (13px, weight 600, blue) - e.g., "150 minutes"

**Input on Same Row:** Input and button are on the same horizontal line, inline with the content

### Section Organization

**Order:**
1. **CHECKLIST (X/Y)** - Simple tasks with rotating squares
2. **CHECK-INS (X)** - Multi check-in tasks
3. **PROGRESS (X)** - Numeric progress tasks

**Section Spacing:**
- Between sections: 20px
- Within section: 10px between cards

### Empty States

**No Tasks:**
```
🎉 (text-6xl)
All done! (font-bold, warm-text-primary)
```
Center-aligned in content area

---

## Kiosk Mode

### Device Specifications
- **Target Devices:** Tablets (iPad, Android tablets)
- **Viewport Width:** 768px+
- **Orientation:** Landscape or Portrait
- **Container:** 95vw width, 90vh height

### Layout Structure

#### Modal Container
```css
max-width: 95vw;
height: 90vh;
display: flex;
flex-direction: column;
padding: 0;
```

#### Header
```css
padding: 32px;
background: linear-gradient(135deg, rgba(144, 164, 174, 0.1), rgba(77, 182, 172, 0.1));
border-bottom: 2px solid #D7CCC8;
```

**Header Content:**
1. Person name + "Check-in" (36px, weight 700)
2. Close button (top-right, 6px icon size)

#### Content Area
```css
padding: 32px;
overflow-y: auto;
max-height: calc(90vh - 140px);
background: #EFEBE9;
```

### Three-Column Scrolling Layout

**Fixed Viewport:** No page overflow
**Independent Scroll Regions:**

1. **Left Column: Simple Tasks**
   - Width: 40%
   - Max-height: calc(90vh - 200px)
   - Overflow-y: auto
   - Scroll independently

2. **Right Top: Multi Check-in Tasks**
   - Width: 60%
   - Max-height: 45%
   - Overflow-y: auto
   - Scroll independently

3. **Right Bottom: Progress Tasks & Goals**
   - Width: 60%
   - Max-height: 45%
   - Overflow-y: auto
   - Scroll independently

### Task Card Specifications (Kiosk)

**All font sizes are 2x dashboard sizes**

#### Simple Tasks
- Same A3 + C4 pattern as dashboard
- Font sizes: 28px name, 26px description
- Square size: Still 12px (proportionally smaller relative to text)
- Padding: 20px 24px (increased from dashboard)
- Gap: 16px (increased from 12px)

#### Completed Task Background
- **Darker shade:** #DDD5D0 (instead of #E0F2F1)
- Makes completed tasks more distinguishable in kiosk mode

#### Multi Check-in & Progress
- Same card structure as dashboard but scaled 2x
- Input and button remain on same row
- Larger touch targets for tablet interaction

### Inline Controls Specification

**Progress Tasks Input Row:**
```
[📊] [Task Name]          [  Input  ] [Add Button]  [150 min]
     [Description]
```

- Input width: 100px (scaled from 70px)
- Button padding: 10px 20px (scaled from 6px 14px)
- Gap between input and button: 16px (scaled from 12px)
- All on same horizontal line for easy tablet use

---

## Component Specifications

### C4 Rotating Square

**Purpose:** Visual completion feedback
**Size:** 12px × 12px (same for both dashboard and kiosk)
**Position:** Align with text baseline (margin-top: 4px in dashboard, adjusted in kiosk)

#### Incomplete State
```css
width: 12px;
height: 12px;
border: 2.5px solid #90A4AE;
background: transparent;
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

#### Complete State
```css
width: 12px;
height: 12px;
border: 2.5px solid #4DB6AC;
background: #4DB6AC;
transform: rotate(45deg);
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

**Animation:** Smooth 45° rotation with cubic-bezier easing

### Goal Progress Bar

**Layout:**
```
[Badge]  [====Progress Bar====]  [75%]
```

**Badge:**
```css
display: inline-flex;
align-items: center;
gap: 4px;
padding: 2px 8px;
border-radius: 8px;
background: rgba(144, 202, 249, 0.08);
color: #1976D2;
font-size: 12px;
font-weight: 600;
white-space: nowrap;
```

**Bar Container:**
```css
flex: 1;
height: 4px;
background: rgba(144, 202, 249, 0.2);
border-radius: 2px;
overflow: hidden;
```

**Bar Fill:**
```css
height: 100%;
background: linear-gradient(90deg, #42A5F5 0%, #1976D2 100%);
transition: width 0.3s ease;
border-radius: 2px;
```

**Percentage:**
```css
font-size: 11px;
font-weight: 700;
color: #42A5F5;
min-width: 32px;
text-align: right;
```

### Buttons

#### Dashboard Progress Button
```css
background: white;
border: 1px solid #42A5F5;
padding: 6px 14px;
border-radius: 10px;
font-weight: 600;
color: #1976D2;
font-size: 13px;
transition: all 0.2s;
```

**Active State:**
```css
transform: scale(0.95);
```

**Disabled State:**
```css
opacity: 0.5;
cursor: not-allowed;
```

#### Kiosk Progress Button
- Same styling but scaled 2x (12px 28px padding)
- Larger touch target for tablet use

### Input Fields

#### Dashboard Number Input
```css
width: 70px;
padding: 6px 10px;
border: 1px solid #42A5F5;
border-radius: 8px;
font-weight: 600;
color: #1976D2;
font-size: 13px;
text-align: center;
```

**Focus State:**
```css
outline: none;
border-color: #1976D2;
```

#### Kiosk Number Input
- Width: 100px (scaled from 70px)
- Padding: 10px 16px (scaled)
- Font-size: 22px (scaled)

---

## Interaction Patterns

### Task Completion Flow

#### Dashboard Simple Tasks
1. **Tap card** → Toggle completion state
2. **Visual feedback:**
   - Square rotates 45° (0.25s cubic-bezier)
   - Background fades to teal (0.25s)
   - Text color changes to teal (0.25s)
   - Card scales to 0.98 on active (touch feedback)
3. **Optimistic update:** UI updates immediately
4. **Server sync:** Background mutation
5. **Goal progress bars update** in real-time if task is linked to goal

#### Kiosk Simple Tasks
- Same flow as dashboard
- Larger touch targets
- Darker completed background (#DDD5D0)

### Multi Check-in Flow

1. **Tap +1 button**
2. **Counter increments** (e.g., 5x → 6x)
3. **Button shows loading state** (if pending)
4. **Optimistic update** to UI
5. **Background sync** to server

### Progress Task Flow

1. **Tap input field** → Keyboard appears
2. **Enter numeric value**
3. **Tap "Add" button**
4. **Value clears** from input
5. **Total updates** (e.g., 150 min → 180 min)
6. **Optimistic update** to UI
7. **Background sync** to server

### Undo Functionality

**Pattern:** Completed tasks can be undone by tapping again
1. Tap completed task
2. Square un-rotates to 0°
3. Background fades back to light gray
4. Text color reverts to gray
5. Completion removed from server

---

## Accessibility Guidelines

### Color Contrast

**WCAG AA Compliance:**
- Incomplete text on light gray: 4.5:1 minimum
- Complete text on teal: 4.5:1 minimum
- Progress text on light blue: 4.5:1 minimum

### Touch Targets

**Dashboard (Mobile):**
- Minimum touch target: 44px × 44px
- Card padding provides adequate tap area

**Kiosk (Tablet):**
- Minimum touch target: 48px × 48px
- Larger cards and buttons for tablet use

### Font Sizing

**Readability:**
- Dashboard minimum: 12px (section titles)
- Kiosk minimum: 24px (scaled)
- Primary text: 16px+ dashboard, 28px+ kiosk

### Visual Feedback

**All interactive elements must provide:**
1. **Hover state** (desktop/tablet): Opacity change or background color shift
2. **Active state** (tap): Scale transform (0.95-0.98)
3. **Disabled state**: Reduced opacity (0.5), cursor: not-allowed
4. **Focus state**: Visible outline or border color change

### Screen Reader Support

**Semantic HTML:**
- Use proper heading hierarchy (h1, h2, h3)
- Buttons with descriptive labels
- ARIA labels for icon-only buttons
- ARIA live regions for completion feedback

---

## Responsive Breakpoints

### Mode Detection
```javascript
const isKioskMode = window.innerWidth >= 768;
```

**Dashboard Mode:** < 768px
**Kiosk Mode:** ≥ 768px

### CSS Media Query
```css
@media (min-width: 768px) {
  /* Kiosk-specific styles */
  .kiosk-task-name { font-size: 28px; }
  .kiosk-task-desc { font-size: 26px; }
  .kiosk-section-title { font-size: 32px; }
}
```

---

## Animation & Transitions

### Global Easing
```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

### Completion Animation
1. **Square rotation:** 0.25s cubic-bezier
2. **Background color:** 0.25s cubic-bezier
3. **Text color:** 0.25s cubic-bezier
4. **Goal bar width:** 0.3s ease

### Button Interactions
- **Active (tap):** 0.2s all
- **Scale:** transform: scale(0.95)

### Loading States
- **Spinner:** Rotating animation
- **Button:** Disabled state with reduced opacity

---

## Implementation Checklist

### Dashboard Mode
- [ ] Container max-width 420px, rounded corners 24px
- [ ] Header with gradient background and teal accents
- [ ] Section titles uppercase, 12px, tracked
- [ ] A3 task cards with 16px border-radius
- [ ] C4 rotating squares (12px, 45° on complete)
- [ ] Inline goal progress bars under linked tasks
- [ ] Progress cards with inline input + button
- [ ] Font sizes: 16px task names, 13px descriptions
- [ ] Color states: Gray (incomplete) → Teal (complete)
- [ ] Smooth transitions (0.25s cubic-bezier)

### Kiosk Mode
- [ ] Container 95vw × 90vh, fixed viewport
- [ ] Three independent scrolling sections
- [ ] All font sizes 2x dashboard
- [ ] Darker completed background (#DDD5D0)
- [ ] Input and button on same row
- [ ] Larger touch targets (48px minimum)
- [ ] Header 32px padding with gradient
- [ ] Section padding 32px
- [ ] Same A3 + C4 patterns as dashboard
- [ ] Smooth scrolling in all three regions

### Common Elements
- [ ] Warm Earth color palette CSS variables
- [ ] System font stack (-apple-system, BlinkMacSystemFont)
- [ ] Optimistic updates for all mutations
- [ ] Real-time goal progress updates
- [ ] Undo functionality for completed tasks
- [ ] Loading states and disabled states
- [ ] WCAG AA contrast compliance
- [ ] Semantic HTML and ARIA labels

---

## Design Files Reference

**Prototypes:**
- `designs/dashboard-v1-color3.html` - Dashboard Warm Earth
- `designs/kiosk-v1-color3.html` - Kiosk Warm Earth

**Implementation:**
- `components/person/person-checkin-modal.tsx` - React component
- `app/globals.css` - CSS styles (lines 200-550+)

**Color Variations:**
- Option 1: Classic Soft Fade
- Option 2: Green Harmony
- **Option 3: Warm Earth** ⭐ (Selected)
- Option 4: Cool Sky
- Option 5: Lavender Calm

---

## Future Enhancements

### Potential Additions
1. Haptic feedback on mobile devices
2. Confetti animation on task completion
3. Sound effects (optional, user preference)
4. Streak counter visualization
5. Daily progress summary card
6. Achievements/badges for milestones
7. Dark mode variant with adjusted colors
8. High contrast mode for accessibility

### Performance Optimizations
1. Virtualized scrolling for large task lists
2. Debounced input handlers
3. Memoized task components
4. Lazy loading for non-visible sections
5. Service worker caching for offline use

---

**End of Specification**

For questions or clarifications, refer to the implementation files or design prototypes.
