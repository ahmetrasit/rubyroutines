# KidTrek UI Components - Quick Reference

## Component Quick Links

### Core UI Components (Ready to Use)

| Component | Location | Variants/Features | Key Styling |
|-----------|----------|-------------------|-------------|
| **Button** | `components/ui/button.tsx` | 5 variants (default, secondary, outline, ghost, danger) + 3 sizes | rounded-lg, touch-targets, transitions |
| **Card** | `components/ui/card.tsx` | Base + Header/Title/Content | bg-white, rounded-xl, shadow-md, p-6 |
| **Dialog/Modal** | `components/ui/dialog.tsx` | Dialog + Content/Header/Title/Footer | fixed center, max-w-lg, overlay, escapeClose |
| **Input** | `components/ui/input.tsx` | Text input (extends HTML) | w-full, rounded-lg, border, focus:ring |
| **Label** | `components/ui/label.tsx` | Form label | block, text-sm, font-medium, mb-1 |
| **Form** | `components/ui/form.tsx` | Form/Field/Item/Label/Control/Message | Context-based, validation support |
| **Toast** | `components/ui/toast.tsx` | Provider + Hook + 3 variants | fixed bottom-right, auto-dismiss 5s |

### Feature Components (Domain-Specific)

| Component | Location | Purpose | Special Features |
|-----------|----------|---------|-----------------|
| **PersonCard** | `components/person/person-card.tsx` | Display child profile | Emoji avatar, border-color from avatar, edit/delete buttons |
| **PersonList** | `components/person/person-list.tsx` | List all children | Grid layout (1/2/3 cols), empty state, add/restore |
| **PersonForm** | `components/person/person-form.tsx` | Create/edit child | 32-color picker, 99-emoji selector, live preview |
| **RoutineCard** | `components/routine/routine-card.tsx` | Display routine | Task count, reset period, visibility status, assignments |
| **RoutineList** | `components/routine/routine-list.tsx` | List routines | Grid (1/2 cols), empty state |
| **RoutineForm** | `components/routine/routine-form.tsx` | Create/edit routine | Reset period options, visibility control |
| **TaskItem** | `components/task/task-item.tsx` | Display single task | 3 task types with different UIs, undo timer, progress bar |
| **TaskList** | `components/task/task-list.tsx` | List tasks | Reordering (up/down arrows), empty state |
| **TaskForm** | `components/task/task-form.tsx` | Create/edit task | Icon picker (40 emojis), type-specific fields, preview |
| **RestorePersonDialog** | `components/person/restore-person-dialog.tsx` | Restore archived children | Scrollable list with dates |

---

## Color System

### Primary Colors
- **Primary Blue**: #0ea5e9 (500) - Main action color
- **Primary Shades**: 50-900 gradient for depth/emphasis
- **Complementary Colors**: Gray (neutral), Red (danger), Green (success), Purple (warning)

### Avatar Colors
32 pastel colors: #FFB3BA, #FFDFBA, #FFFFBA, #BAFFC9, #BAE1FF, etc.

### Semantic Colors
- **Success**: bg-green-50, text-green-700
- **Danger**: bg-red-50, text-red-900
- **Info**: bg-blue-50, text-blue-900
- **Warning**: bg-purple-50, text-purple-700

---

## Typography & Spacing

### Font Sizes
- **h1/Page Title**: text-3xl/4xl
- **h2/Section**: text-2xl
- **h3/Card Title**: text-lg/xl
- **Body**: text-base
- **Small**: text-sm
- **Tiny**: text-xs

### Font Weights
- Headings: font-bold, font-semibold
- Labels: font-medium
- Body: regular

### Spacing Grid
- Gaps: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px)
- Padding: p-3, p-4, p-6, p-8
- Margins: mb/mt 1, 2, 4, 6, 8

---

## Common Tailwind Classes Used

### Layout
```
flex, items-center, justify-center, justify-between, justify-end
flex-col, flex-1, min-w-0, flex-shrink-0
gap-2, gap-3, gap-4, gap-6
space-y-2, space-y-4, space-y-6
```

### Sizing
```
w-full, max-w-md, max-w-lg, max-w-7xl
h-screen, min-h-screen, py-8, px-4
```

### Borders & Radius
```
rounded-lg, rounded-xl
border, border-t-4, border-l-4
border-gray-300, border-primary-500
```

### Shadows & Effects
```
shadow-md, hover:shadow-lg
transition-all, transition-colors, transition-opacity
opacity-50, opacity-0, hover:opacity-100
scale-105, scale-110
```

### Colors
```
bg-gray-50, bg-white, bg-primary-500
text-gray-900, text-gray-600, text-gray-500
text-primary-500
```

---

## Interactive Patterns

### Button States
```
Hover: Color shift + transition
Focus: ring-2 ring-offset-2 ring-[color]
Disabled: opacity-50 pointer-events-none
Active: Variant-dependent background
```

### Card Hover
```
shadow-md → hover:shadow-lg
transition-all
```

### Form Field Focus
```
focus:outline-none
focus:ring-2 focus:ring-primary-500
focus:border-transparent
```

### Toast Notification
```
Position: fixed bottom-0 right-0
Auto-dismiss: 5 seconds
Variants: default (white), success (green), destructive (red)
```

---

## Layout Patterns by Page Type

### Dashboard Layout
```
Container: min-h-screen bg-gray-50
Content: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
Header: mb-8 (title + subtitle)
Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### Auth Layout
```
Container: min-h-screen bg-gray-50 flex items-center justify-center
Content: max-w-md px-4 space-y-8
Form: space-y-4 to space-y-6
```

### Detail Page
```
Container: min-h-screen bg-gray-50
Content: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
Back Button: mb-6
Header Card: bg-white rounded-xl shadow-md p-6/8 mb-8
Content: Standard grid/list below
```

---

## Empty States

```
Container: text-center py-12/16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50
Icon: text-6xl (emoji)
Title: text-lg font-medium text-gray-600 mb-4
Description: text-sm text-gray-500 mb-6
CTA: <Button> with icon + text
```

---

## Form Field Pattern

```
Container: space-y-2/4
Label: block text-sm font-medium text-gray-700 mb-1
Input/Select: w-full border border-gray-300 rounded-lg/md px-3/4 py-2
Helper: text-xs text-gray-500 mt-1
Error: text-sm font-medium text-red-600
Focus: outline-none ring-2 ring-primary-500 border-transparent
```

---

## Badge & Badge Variants

```
Standard Badge: text-xs px-2 py-1 rounded
With Count: bg-gray-100

Colored Badges:
- Info: bg-blue-50 text-blue-700
- Success: bg-green-100 text-green-700
- Danger/Status: bg-red-100 text-red-700
- Purple/Warning: bg-purple-100 text-purple-700
```

---

## Avatar System (Unique KidTrek Feature)

### Color Selection
- 32 pastel colors
- Grid layout: grid-cols-8 gap-2
- Selected state: ring-4 ring-offset-2 ring-gray-400 scale-105
- Hover: scale-105 ring-2 ring-gray-300

### Emoji Selection
- 99+ common emojis (smileys, animals, music, sports, etc.)
- Searchable: Search input with live filtering
- Grid: grid-cols-8 gap-2 max-h-48 overflow-y-auto
- Selected: bg-primary-100 ring-2 ring-primary-500 scale-110

### Avatar Display
```
Size options: h-10/16/20/24 w-10/16/20/24
Border-radius: rounded-full
Background: color + '20' (20% opacity)
Content: Single emoji
```

---

## Task Type Indicators

| Type | Badge | Color | UI |
|------|-------|-------|-----|
| Simple | "✓ Done today" | bg-green-100 text-green-700 | Toggle button "Mark Done" |
| Multiple Check-in | "Multi Check-in" | bg-blue-100 text-blue-700 | Counter + "Check In" button |
| Progress | "Progress Tracking" | bg-purple-100 text-purple-700 | Number input + unit + progress bar |

---

## Icons Used (from lucide-react)

Common icons throughout the app:
- **Navigation**: ArrowLeft, ArrowUp, ArrowDown, ArrowRight
- **Actions**: Plus, Search, Pencil, Trash2, Check, Undo2
- **Status**: Eye, EyeOff, RotateCcw
- **UI**: X (close), Menu

---

## Responsive Breakpoints

- **Mobile-first**: Default mobile styling
- **sm (640px)**: First breakpoint for tablets
- **md (768px)**: Tablet to desktop transition
- **lg (1024px)**: Desktop-specific layouts

### Common Responsive Classes
```
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
px-4 sm:px-6 lg:px-8
text-sm sm:text-base md:text-lg
max-w-md md:max-w-lg lg:max-w-7xl
```

---

## Key Design Decisions

1. **Touch-First**: All interactive elements are 44px+ (standard mobile)
2. **Pastel Aesthetic**: 32 warm, friendly pastel colors for avatars
3. **Emoji-Based**: User avatars use emojis + colors instead of photos
4. **Card-Based UI**: Information presented in rounded cards with consistent spacing
5. **Modal Forms**: Create/edit done in dialogs, not separate pages
6. **Empty States**: Every list has friendly empty state with CTA
7. **Live Previews**: Forms show how final result will look
8. **Animations**: Subtle transitions (200-300ms) for state changes
9. **Semantic Colors**: Consistent use of green (success), red (danger), blue (info)
10. **Focus on Kids**: Age-appropriate, colorful, encouraging design

---

## Tips for Migration

1. **Start with Core UI**: Button, Card, Dialog, Input, Form first
2. **Use Tailwind**: All styling is Tailwind CSS (no CSS-in-JS)
3. **Icon Library**: Use lucide-react for consistency
4. **Colors**: Define primary blue in tailwind config, use semantic vars
5. **Spacing**: Follow 4px grid (1=4px, 2=8px, etc.)
6. **Responsive**: Always test mobile, tablet, desktop
7. **Accessibility**: Use proper labels, focus rings, touch targets
8. **Transitions**: Keep to 200-300ms, use transition-all or transition-colors
9. **Emojis**: No image processing needed - pure text emojis
10. **Modals**: Use Dialog wrapper for consistency

---

## File Organization for New Projects

```
components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── form.tsx
│   └── toast.tsx
├── person/
│   ├── person-card.tsx
│   ├── person-list.tsx
│   ├── person-form.tsx
│   └── restore-person-dialog.tsx
├── routine/
│   ├── routine-card.tsx
│   ├── routine-list.tsx
│   └── routine-form.tsx
└── task/
    ├── task-item.tsx
    ├── task-list.tsx
    └── task-form.tsx

app/
├── globals.css (Tailwind + touch-target utilities)
├── layout.tsx (Root with providers)
├── (auth)/
│   ├── layout.tsx (Centered auth container)
│   ├── login/page.tsx
│   └── signup/page.tsx
└── (dashboard)/
    ├── parent/page.tsx (Dashboard)
    ├── parent/[personId]/page.tsx (Person detail)
    └── parent/[personId]/[routineId]/page.tsx (Routine detail)

tailwind.config.ts (Primary color + content paths)
```

---

## Statistics

- **Total Components**: 17 (7 UI base + 10 feature components)
- **Design System Colors**: 40+ distinct colors (primary + pastel + semantic)
- **Avatar Customization**: 32 colors × 99 emojis = 3,168 combinations
- **Task Icons**: 40 emoji options
- **Responsive Breakpoints**: 3 (sm, md, lg)
- **Button Variants**: 5 × 3 sizes = 15 combinations
- **Toast Variants**: 3 (default, success, destructive)
- **Lines of Catalog**: 1000+ (comprehensive documentation)

