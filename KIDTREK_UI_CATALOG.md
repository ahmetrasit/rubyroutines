# KidTrek UI Components & Visual Elements Catalog

## Overview
This document catalogs all UI components, layout patterns, visual styling, and interactive elements from the KidTrek design system (as implemented in Ruby Routines).

---

## 1. DESIGN SYSTEM & FOUNDATIONAL ELEMENTS

### Color Palette
- **Primary Blue**: Sky blue gradient (50-900 shades)
  - 50: #f0f9ff
  - 100: #e0f2fe
  - 200: #bae6fd
  - 300: #7dd3fc
  - 400: #38bdf8
  - 500: #0ea5e9 (primary)
  - 600: #0284c7
  - 700: #0369a1
  - 800: #075985
  - 900: #0c4a6e

- **Pastel Avatar Colors** (32 colors used for person avatars)
  - #FFB3BA, #FFDFBA, #FFFFBA, #BAFFC9, #BAE1FF, #E0BBE4, #FFDFD3, #FEC8D8
  - #D4F1F4, #C9E4DE, #F7D9C4, #FAACA8, #DFE7FD, #B4F8C8, #FBE7C6, #A0E7E5
  - #FFAEBC, #FBE4D8, #D5AAFF, #85E3FF, #FFDAC1, #E2F0CB, #B5EAD7, #C7CEEA
  - #FFDFD3, #E6E6FA, #FFE5B4, #F0E68C, #D8BFD8, #FFE4E1, #E0FFFF, #F5DEB3

- **Semantic Colors**
  - Success/Green: #10b981, #059669, #047857
  - Danger/Red: #ef4444, #dc2626, #b91c1c
  - Warning/Purple: #a855f7
  - Gray: #f3f4f6, #e5e7eb, #d1d5db, #9ca3af, #6b7280, #4b5563, #374151, #1f2937, #111827
  - Blue shades (info): #3b82f6, #2563eb, #1d4ed8
  - Purple shades: #a855f7, #9333ea
  - Green shades: #10b981, #059669

### Typography
- **Font Stack**: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
- **Code Font**: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace
- **Font Smoothing**: -webkit-font-smoothing: antialiased, -moz-osx-font-smoothing: grayscale

### Touch Targets
- **Standard Touch Target**: 44px × 44px (min-width, min-height)
- **Large Touch Target**: 64px × 64px (min-width, min-height)

### Layout & Spacing Utilities
- **Container**: max-w-7xl mx-auto
- **Padding**: px-4 sm:px-6 lg:px-8, py-8
- **Gap Sizes**: gap-1, gap-2, gap-3, gap-4, gap-6

---

## 2. CORE UI COMPONENTS

### 2.1 Button Component
**File**: `/home/user/rubyroutines/components/ui/button.tsx`

**Variants**:
- `default`: bg-primary-500 → hover:bg-primary-600, white text, primary focus ring
- `secondary`: bg-gray-200 → hover:bg-gray-300, gray-900 text, gray focus ring
- `outline`: border border-primary-500, primary text, hover:bg-primary-50
- `ghost`: transparent, gray-700 text, hover:bg-gray-100
- `danger`: bg-red-500 → hover:bg-red-600, white text, red focus ring

**Sizes**:
- `sm`: px-3 py-1.5 text-sm + touch-target (44px)
- `md`: px-4 py-2 text-base + touch-target (44px)
- `lg`: px-6 py-3 text-lg + touch-target-lg (64px)

**Styling**:
- Inline-flex, items-center, justify-center
- Border-radius: rounded-lg
- Font-weight: medium
- Transitions: transition-colors
- Focus: focus:outline-none focus:ring-2 focus:ring-offset-2
- Disabled: disabled:pointer-events-none disabled:opacity-50

**Interactive States**:
- Hover: background color shift
- Focus: ring outline with offset
- Active: inherited from variant
- Disabled: opacity-50, pointer-events-none

---

### 2.2 Card Component
**File**: `/home/user/rubyroutines/components/ui/card.tsx`

**Base Card**:
- Background: bg-white
- Border-radius: rounded-xl
- Shadow: shadow-md
- Padding: p-6

**Subcomponents**:
- `CardHeader`: mb-4
- `CardTitle`: text-2xl font-bold text-gray-900
- `CardContent`: flexible content container

**Interactive States**:
- Hover: Custom implementations add hover:shadow-lg, transition-all

---

### 2.3 Dialog/Modal Component
**File**: `/home/user/rubyroutines/components/ui/dialog.tsx`

**Structure**:
- `Dialog`: Container with open state management
- `DialogTrigger`: Click handler to open dialog
- `DialogContent`: Modal content wrapper
- `DialogHeader`: Header container
- `DialogTitle`: Modal title
- `DialogDescription`: Modal description text
- `DialogFooter`: Action buttons container

**Styling**:
- **Overlay**: fixed inset-0 z-50 bg-black bg-opacity-50
- **Content Box**:
  - Position: fixed left-1/2 top-1/2 z-[60]
  - Size: w-full max-w-lg max-h-[90vh]
  - Transform: -translate-x-1/2 -translate-y-1/2
  - Border-radius: rounded-xl
  - Background: bg-white
  - Padding: p-6
  - Shadow: shadow-lg
  - Overflow: overflow-y-auto

**Interactive Features**:
- Click outside (overlay) closes dialog
- Escape key closes dialog
- Body scroll disabled when modal open
- Click inside content doesn't propagate

**Subcomponent Styling**:
- Header: flex flex-col space-y-1.5 text-center sm:text-left
- Title: text-lg font-semibold leading-none tracking-tight
- Description: text-sm text-gray-600
- Footer: flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2

---

### 2.4 Input Component
**File**: `/home/user/rubyroutines/components/ui/input.tsx`

**Styling**:
- Width: w-full
- Padding: px-4 py-2
- Border: border border-gray-300
- Border-radius: rounded-lg
- Background: white (inherited)
- Text: base size

**Interactive States**:
- Focus: focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
- Placeholder: placeholder:text-gray-400
- Disabled: disabled:cursor-not-allowed disabled:opacity-50
- Transitions: transition-colors

---

### 2.5 Label Component
**File**: `/home/user/rubyroutines/components/ui/label.tsx`

**Styling**:
- Display: block
- Font: text-sm font-medium
- Color: text-gray-700
- Margin-bottom: mb-1

---

### 2.6 Form Components
**File**: `/home/user/rubyroutines/components/ui/form.tsx`

**Subcomponents**:
- `Form`: Wrapper with error context
- `FormField`: Field container with unique ID and name context
- `FormItem`: Individual form item wrapper
- `FormLabel`: Label with auto-connected htmlFor
- `FormControl`: Wraps input/select elements, injects id and name
- `FormDescription`: Helper text (text-sm text-gray-600)
- `FormMessage`: Error message (text-sm font-medium text-red-600)

**Layout**:
- FormField: space-y-2
- FormItem: space-y-2

---

### 2.7 Toast/Notification Component
**File**: `/home/user/rubyroutines/components/ui/toast.tsx`

**Toast Container**:
- Position: fixed bottom-0 right-0 z-50
- Layout: flex max-h-screen w-full flex-col-reverse gap-2
- Padding: p-4
- Responsive: sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]

**Individual Toast**:
- Layout: relative flex w-full items-center justify-between space-x-4
- Padding: p-6 pr-8
- Border-radius: rounded-md
- Shadow: shadow-lg
- Transitions: transition-all
- Pointer: pointer-events-auto

**Toast Variants**:
- `default`: border-gray-200 bg-white (text-gray-900 inherited)
- `destructive`: border-red-200 bg-red-50 text-red-900
- `success`: border-green-200 bg-green-50 text-green-900

**Toast Content**:
- Title: text-sm font-semibold
- Description: text-sm opacity-90

**Close Button**:
- Position: absolute right-2 top-2
- Styling: rounded-md p-1 text-gray-500
- Interactive: opacity-0 → transition-opacity → hover:text-gray-900 focus:opacity-100 group-hover:opacity-100

**Auto-dismiss**: 5 seconds

**Features**:
- `useToast()` hook for dispatching toasts
- `dismiss()` function to remove by ID
- Context-based state management

---

## 3. FEATURE COMPONENTS

### 3.1 Person Card Component
**File**: `/home/user/rubyroutines/components/person/person-card.tsx`

**Card Structure**:
- Container: group relative rounded-xl bg-white p-6 shadow-md
- Hover Effect: hover:shadow-lg transition-all
- Interactive: cursor-pointer
- Border: border-t-4 with avatar color

**Avatar Section**:
- Avatar Container: h-16 w-16 rounded-full flex items-center justify-center text-3xl
- Background: bgcolor + '20' (20% opacity version)
- Content: Emoji character

**Header Section**:
- Layout: flex items-center gap-4 mb-4
- Avatar Area: flex-shrink-0
- Name Area: flex-1 min-w-0
- Name Text: font-bold text-xl text-gray-900 truncate

**Action Buttons**:
- Container: flex gap-2
- Edit Button: size="sm" variant="outline" flex-1
- Delete Button: size="sm" variant="ghost" (only if name !== 'Me')

**Interactive States**:
- Click on card: Opens person detail/selection
- Hover: shadow-lg (group-based)
- Edit/Delete buttons: Stop propagation

---

### 3.2 Person List Component
**File**: `/home/user/rubyroutines/components/person/person-list.tsx`

**Layout**:
- Container: space-y-6
- Header: flex justify-between items-center
- Title: text-2xl font-bold text-gray-900

**Grid**:
- Empty State: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

**Empty State**:
- Text center py-12
- Border: border-2 border-dashed border-gray-300
- Background: bg-gray-50
- Border-radius: rounded-xl
- Text: text-gray-600 mb-4 text-lg

---

### 3.3 Person Form Component
**File**: `/home/user/rubyroutines/components/person/person-form.tsx`

**Form Structure**:
- Dialog modal
- Title: "Edit Person" or "Add New Child"

**Form Sections**:

1. **Name Input**:
   - Label: "Name *"
   - Input field with maxLength={100}
   - Placeholder: "Enter name"

2. **Color Palette**:
   - Label: "Choose Color"
   - Grid: grid-cols-8 gap-2
   - Color Buttons (32 total):
     - Styling: w-10 h-10 rounded-full transition-all
     - Selected: ring-4 ring-offset-2 ring-gray-400 scale-105
     - Unselected: hover:scale-105 hover:ring-2 hover:ring-gray-300

3. **Emoji Picker**:
   - Search Input: with Search icon
   - Emoji Grid: grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg
   - Emoji Buttons:
     - Text size: text-3xl p-2 rounded-lg transition-all
     - Selected: bg-primary-100 ring-2 ring-primary-500 scale-110
     - Unselected: hover:bg-gray-100
   - Empty State: "No emojis found" message

4. **Preview Section**:
   - Border-top pt-4
   - Background: bg-gray-50 rounded-xl p-6
   - Layout: flex items-center gap-4
   - Avatar: w-20 h-20 rounded-full text-4xl
   - Name Display: text-xl font-semibold
   - Description: text-sm text-gray-500

5. **Footer**:
   - Border-top pt-4
   - Buttons: flex gap-2 justify-end
   - Cancel (outline) | Submit (primary)

**Emojis Available**: 99 common emojis (smileys, animals, music, sports, etc.)

---

### 3.4 Routine Card Component
**File**: `/home/user/rubyroutines/components/routine/routine-card.tsx`

**Card Structure**:
- Container: group relative rounded-xl border bg-white p-6 shadow-md
- Hover: hover:shadow-lg transition-all
- Interactive: cursor-pointer
- Opacity: !visible ? 'opacity-60' : ''

**Header Section**:
- Layout: flex items-start justify-between
- Title: font-semibold text-lg truncate
- Visibility Icon: EyeOff icon if not visible (h-4 w-4 text-gray-400)

**Description**:
- Text: text-sm text-gray-600 mt-1 line-clamp-2

**Metadata Badges**:
- Layout: flex flex-wrap gap-2 mt-3
- Badge Style: text-xs px-2 py-1 bg-gray-100 rounded
- Content: Task count, Reset period, Visibility description, Assignments

**Assignments**:
- Layout: flex flex-wrap gap-1 mt-2
- Assignment Badge: text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded

**Action Buttons**:
- Container: flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2
- Edit Button: size="sm" variant="ghost"
- Delete Button: size="sm" variant="ghost" (only if name !== 'Daily Routine')

---

### 3.5 Routine List Component
**File**: `/home/user/rubyroutines/components/routine/routine-list.tsx`

**Layout**:
- Container: space-y-6
- Header: flex justify-between items-center
- Title: text-2xl font-bold text-gray-900

**Grid**:
- Grid: grid-cols-1 md:grid-cols-2 gap-6

**Empty State**:
- Text center py-12
- Border: border-2 border-dashed border-gray-300
- Background: bg-gray-50
- Border-radius: rounded-xl
- Text: text-gray-600 mb-4 text-lg

---

### 3.6 Routine Form Component
**File**: `/home/user/rubyroutines/components/routine/routine-form.tsx`

**Form Structure**:
- Dialog modal
- Title: "Edit Routine" or "Create New Routine"

**Form Sections**:

1. **Name Input**:
   - Label: "Name *"
   - Input field
   - Note: Disabled for 'Daily Routine'

2. **Description**:
   - Label: "Description"
   - Textarea: rows={3} maxLength={500}
   - Styling: w-full rounded-md border border-gray-300 px-3 py-2

3. **Reset Period**:
   - Label: "Reset Period *"
   - Select dropdown: Daily, Weekly, Monthly
   - Styling: w-full rounded-md border border-gray-300 px-3 py-2

4. **Reset Day** (Conditional):
   - Weekly: Select dropdown (Sun-Sat)
   - Monthly: Number input (1-28, 99 for last day)

5. **Visibility**:
   - Label: "Visibility *"
   - Select dropdown: Always, Specific Days, Date Range

6. **Footer**:
   - Buttons: flex gap-2 justify-end
   - Cancel (outline) | Submit (primary)

---

### 3.7 Task Item Component
**File**: `/home/user/rubyroutines/components/task/task-item.tsx`

**Item Structure**:
- Container: flex items-start gap-3 p-4 border border-gray-200 rounded-xl bg-white
- Hover: hover:shadow-md transition-all

**Content Section**:
- Layout: flex-1 min-w-0
- Title: font-semibold text-gray-900
- Description: text-sm text-gray-500 mt-2 line-clamp-2

**Status Badges**:
- Done Badge (Simple): text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium with ✓
- Multi Check-in Badge: text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full
- Progress Badge: text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full

**Completion UI** (varies by task type):

**Simple Task**:
- Button: "Mark Done" (outline) or "Done" (primary, disabled)
- Undo Feature: Shows timer when completed (minutes:seconds format)
- Undo Button: Shows for 5 minutes after completion

**Multiple Check-in Task**:
- Counter: text-sm font-medium (displays count)
- Button: "Check In" (outline)

**Progress Task**:
- Input: type="number" step="0.01" min="0" w-20 h-8
- Unit Label: text-sm text-gray-600
- Add Button: "Add" (outline)
- Progress Bar:
  - Container: flex-1 h-2 bg-gray-200 rounded-full overflow-hidden
  - Fill: h-full bg-green-500 transition-all (width based on percentage)
  - Stats: text-xs text-gray-600 whitespace-nowrap

**Action Buttons**:
- Container: flex gap-1
- Edit Button: size="sm" variant="ghost" h-8 w-8 p-0
- Delete Button: size="sm" variant="ghost" h-8 w-8 p-0

---

### 3.8 Task List Component
**File**: `/home/user/rubyroutines/components/task/task-list.tsx`

**Layout**:
- Container: space-y-6
- Header: flex justify-between items-center
- Title: text-2xl font-bold text-gray-900

**Task Layout**:
- Container: space-y-3
- Each Task: flex items-center gap-3
  - Reorder Controls: flex flex-col gap-1 (Up/Down buttons)
  - Task: flex-1

**Reorder Buttons**:
- Size: h-7 w-7 p-0
- Styling: variant="ghost" hover:bg-gray-100
- Disabled when at top/bottom or reordering

**Empty State**:
- Text center py-16
- Border: border-2 border-dashed border-gray-300
- Background: bg-gray-50
- Border-radius: rounded-xl
- Icon: text-6xl (📝)
- Title: text-gray-600 mb-2 text-lg font-medium
- Subtitle: text-gray-500 text-sm mb-6

---

### 3.9 Task Form Component
**File**: `/home/user/rubyroutines/components/task/task-form.tsx`

**Form Structure**:
- Dialog modal
- Title: "Edit Task" or "Create New Task"

**Form Sections**:

1. **Task Name**:
   - Label: "Task Name *"
   - Input field: maxLength={200}
   - Placeholder: "Brush teeth"

2. **Description**:
   - Label: "Description"
   - Textarea: rows={3} maxLength={500}
   - Styling: w-full rounded-lg border border-gray-300 px-4 py-2
   - Focus: focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent

3. **Icon Picker**:
   - Label: "Choose Icon"
   - Grid: grid-cols-10 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg
   - Icon Buttons (40 emojis):
     - Text size: text-2xl p-2 rounded-lg transition-all
     - Selected: bg-primary-100 ring-2 ring-primary-500 scale-110
     - Unselected: hover:bg-gray-100

4. **Task Type**:
   - Label: "Task Type *"
   - Select dropdown:
     - Simple (Once per period)
     - Multiple Check-in (Track count)
     - Progress (Track value)

5. **Type-specific Fields** (Conditional):
   - Progress Type:
     - Target Value: Input number with step="0.01" min="0"
     - Unit: Input text (placeholder: "pages, minutes, cups, etc.")

6. **Info Boxes** (type-dependent):
   - Simple: bg-blue-50 border border-blue-200 rounded-lg, text-sm text-blue-800
   - Multiple Check-in: bg-purple-50 border border-purple-200 rounded-lg, text-sm text-purple-800

7. **Preview Section**:
   - Border-top pt-4
   - Label: "Preview"
   - Background: bg-gray-50 rounded-xl p-4 border border-gray-200
   - Layout: flex items-center gap-3
   - Icon: text-3xl
   - Name: font-semibold text-gray-900
   - Description: text-sm text-gray-500

8. **Footer**:
   - Buttons: flex gap-3 justify-end pt-2
   - Cancel (outline) | Submit (primary, disabled if no name)

**Task Icons** (40 total): ✅, 📝, 🎯, ⏰, 📚, 🏃, 🍎, 💪, 🧘, 🎨, 🎵, 🎮, 📱, 💻, 📖, ✏️, 🖍️, 🖊️, 📄, 📋, 🗓️, ⏱️, ⏲️, ⌛, 🔔, 📣, 🎯, 🏆, 🥇, ⭐, 💡, 🔍, 🔧, 🔨, 🎪, 🎭, 🎬, 🎤, 🎧, 🎸

---

### 3.10 Restore Person Dialog Component
**File**: `/home/user/rubyroutines/components/person/restore-person-dialog.tsx`

**Dialog Structure**:
- Title: "Restore Archived People"
- Description: "Select a person to restore from the archived list"

**Person List**:
- Container: space-y-2 max-h-96 overflow-y-auto
- Each Person: flex items-center justify-between p-3 border rounded-lg

**Person Item**:
- Left Section: flex items-center gap-3
  - Avatar: h-10 w-10 rounded-full (img or initial circle)
  - Name: font-medium
  - Archived Date: text-sm text-gray-500
- Right Section: Restore button (size="sm")

**Footer**:
- Close button (outline variant)

---

## 4. PAGE LAYOUTS & PATTERNS

### 4.1 Root Layout
**File**: `/home/user/rubyroutines/app/layout.tsx`

**Structure**:
- HTML lang="en"
- Body with TRPCProvider and ToasterProvider wrappers
- Metadata: "Ruby Routines", "Routine management for parents and teachers"

---

### 4.2 Auth Layout
**File**: `/home/user/rubyroutines/app/(auth)/layout.tsx`

**Container**:
- Full height: min-h-screen
- Flexbox: flex flex-col items-center justify-center
- Background: bg-gray-50
- Content width: max-w-md px-4
- Spacing: space-y-8

---

### 4.3 Login Page
**File**: `/home/user/rubyroutines/app/(auth)/login/page.tsx`

**Section Layout**:
- Heading: text-3xl font-bold "Welcome back"
- Subheading: text-gray-600 "Log in to your account"

**Form Sections**:
1. **Google Sign-In Button**:
   - Full width: w-full
   - Variant: outline
   - Text: "Continue with Google"

2. **Divider**:
   - Border: border-t border-gray-300
   - Label: bg-gray-50 px-2 text-gray-500 "Or continue with email"

3. **Email Form** (space-y-4):
   - Email Input with label
   - Password Input with label
   - "Forgot password?" link (text-sm text-blue-600 hover:text-blue-700)

4. **Error Message**:
   - Styling: rounded-md bg-red-50 p-3 text-sm text-red-800

5. **Submit Button**: w-full

6. **Sign Up Link**:
   - Text center: text-sm text-gray-600
   - Link: text-blue-600 hover:text-blue-700

---

### 4.4 Sign Up Page
**File**: `/home/user/rubyroutines/app/(auth)/signup/page.tsx`

**Section Layout**:
- Heading: text-3xl font-bold "Create your account"
- Subheading: text-gray-600 "Get started with Ruby Routines"

**Form Sections** (space-y-6):
1. **Google Sign-In Button**: w-full outline variant
2. **Divider**: Same as login
3. **Form Fields** (space-y-4):
   - Name Input with label
   - Email Input with label + helper text (text-xs text-gray-500)
   - Password Input with label + helper text

4. **Messages**:
   - Error: rounded-md bg-red-50 p-3 text-sm text-red-800
   - Success: rounded-md bg-green-50 p-3 text-sm text-green-800

5. **Submit Button**: w-full, disabled if success message shown

6. **Sign In Link**: text center with blue link

---

### 4.5 Parent Dashboard Page
**File**: `/home/user/rubyroutines/app/(dashboard)/parent/page.tsx`

**Layout**:
- Container: min-h-screen bg-gray-50
- Max width: max-w-7xl mx-auto
- Padding: px-4 sm:px-6 lg:px-8 py-8

**Header Section**:
- Title: text-3xl font-bold text-gray-900 "Parent Dashboard"
- Subtitle: text-gray-600 mt-2 "Manage your children and their routines"
- Margin: mb-8

**Content**:
- PersonList component with:
  - Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
  - Person cards with selection handler

---

### 4.6 Person Detail Page
**File**: `/home/user/rubyroutines/app/(dashboard)/parent/[personId]/page.tsx`

**Layout**:
- Container: min-h-screen bg-gray-50
- Max width: max-w-7xl mx-auto
- Padding: px-4 sm:px-6 lg:px-8 py-8

**Back Navigation**:
- Button: variant="ghost" size="sm"
- Icon: ArrowLeft h-4 w-4 mr-2
- Margin: mb-6

**Person Header Card**:
- Container: bg-white rounded-xl shadow-md p-6 mb-8
- Layout: flex items-center gap-6
- Avatar: h-24 w-24 rounded-full text-5xl
- Info: h1 text-3xl font-bold, birth date if available
- Notes: mt-6 p-4 bg-gray-50 rounded-lg

**Routines Section**:
- RoutineList component with grid layout

---

### 4.7 Routine Detail Page
**File**: `/home/user/rubyroutines/app/(dashboard)/parent/[personId]/[routineId]/page.tsx`

**Layout**:
- Container: min-h-screen bg-gray-50
- Max width: max-w-7xl mx-auto
- Padding: px-4 sm:px-6 lg:px-8 py-8

**Back Navigation**:
- Button: variant="ghost" size="sm"
- Icon: ArrowLeft h-4 w-4 mr-2
- Margin: mb-6

**Routine Header Card**:
- Container: bg-white rounded-xl shadow-md p-8 mb-8
- Layout: flex items-center gap-6 mb-6
- Avatar: h-20 w-20 rounded-full text-4xl shadow-sm
- Info: h1 text-4xl font-bold, person name subtitle
- Description: mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200

**Daily Routine Info Box**:
- Styling: mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg
- Text: text-sm text-blue-900 font-medium
- Icon: 📌

**Tasks Section**:
- TaskList component

---

## 5. INTERACTIVE PATTERNS & BEHAVIORS

### 5.1 Dialog/Modal Interactions
- **Open**: Click trigger button
- **Close**: Click overlay, press Escape, click close button
- **Body Scroll**: Disabled when open
- **Focus**: Trapped within modal
- **Animations**: Fade overlay, center position

### 5.2 Hover States
- **Cards**: shadow-md → shadow-lg + transition-all
- **Buttons**: Color shifts + transitions
- **Icons in Cards**: opacity-0 → group-hover:opacity-100 (action buttons)

### 5.3 Avatar Customization
- **Color Selection**: 32-color palette with ring effect when selected
- **Emoji Selection**: 99+ emoji options with search functionality
- **Visual Feedback**: Scale transforms, ring outlines, background highlighting

### 5.4 Form Patterns
- **Validation**: Show error messages below fields in red
- **Loading States**: "Saving..." text, disabled buttons
- **Preview Sections**: Show how final result will look
- **Help Text**: Gray 12px text below inputs

### 5.5 List Interactions
- **Grid Layouts**: Responsive multi-column (1, 2, 3 columns)
- **Empty States**: Large icons, centered text, call-to-action button
- **Hover Effects**: Shadow lift, subtle color changes
- **Reordering**: Up/Down arrow buttons with disabled states

### 5.6 Toast Notifications
- **Position**: Fixed bottom-right
- **Auto-dismiss**: 5 seconds
- **Variants**: success (green), destructive (red), default (white/gray)
- **Close Button**: Hover-activated with smooth opacity transition

### 5.7 Loading States
- **Text Loading**: "Loading..."
- **Button Loading**: "Saving...", "Creating...", etc.
- **Disabled State**: opacity-50, pointer-events-none

### 5.8 Navigation Patterns
- **Breadcrumb Style**: Back buttons with ArrowLeft icon
- **Route-based**: onClick handlers that push routes
- **Selection**: Cards are clickable with selection handlers

---

## 6. REUSABLE UI PATTERNS

### 6.1 Card Grid Patterns
- **Person Cards**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Routine Cards**: grid-cols-1 md:grid-cols-2 gap-6
- **Padding**: p-6
- **Border Radius**: rounded-xl
- **Shadow**: shadow-md with hover:shadow-lg

### 6.2 Button Bar Patterns
- **Header Actions**: flex justify-between items-center
- **Form Actions**: flex gap-2 justify-end
- **Task Controls**: flex gap-1 with horizontal layout
- **Icon Buttons**: h-8 w-8 p-0 for compact layouts

### 6.3 Info Box Patterns
- **Type-based**: Different bg and text colors
  - Info: bg-blue-50 border-blue-200 text-blue-800
  - Success: bg-green-50 border-green-200 text-green-800
  - Danger: bg-red-50 border-red-200 text-red-800
  - Warning: bg-purple-50 border-purple-200 text-purple-800
- **Left Border Variant**: border-l-4 with border-color matching
- **Padding**: p-3 or p-4
- **Border-radius**: rounded-lg or rounded-r-lg

### 6.4 Badge Patterns
- **Inline Badges**: text-xs px-2 py-1 rounded (full or rounded-full)
- **Colored Badges**:
  - Gray: bg-gray-100
  - Blue: bg-blue-50 text-blue-700
  - Green: bg-green-100 text-green-700
  - Purple: bg-purple-100 text-purple-700

### 6.5 Empty State Patterns
- **Container**: text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50
- **Icon**: Large emoji (text-6xl) or icon
- **Title**: text-gray-600 mb-4 text-lg font-medium
- **Description**: text-gray-500 text-sm mb-6
- **Action**: CTA button

### 6.6 Form Field Patterns
- **Container**: space-y-2 or space-y-4
- **Label**: block text-sm font-medium text-gray-700 mb-1
- **Input**: w-full border border-gray-300 rounded-lg/md px-3/4 py-2
- **Helper Text**: text-xs text-gray-500 mt-1
- **Error Text**: text-sm font-medium text-red-600

### 6.7 List Item Patterns
- **Container**: flex items-center/start gap-3 p-3/4 border rounded-lg
- **Hover**: hover:shadow-md transition-all
- **Avatar**: h-10/16 w-10/16 rounded-full
- **Content**: flex-1 min-w-0
- **Actions**: flex gap-1/2

---

## 7. ANIMATION & TRANSITION PATTERNS

### 7.1 Standard Transitions
- **Duration**: 200-300ms (implicit in tailwind)
- **Properties**:
  - Colors: transition-colors
  - All: transition-all (shadow, scale, opacity)
  - Opacity: transition-opacity

### 7.2 Transform Effects
- **Scale**: scale-105, scale-110 on hover/select
- **Translate**: -translate-x-1/2 -translate-y-1/2 (centering)
- **Duration**: Immediate, no delay (default)

### 7.3 Opacity Effects
- **Hover Reveal**: opacity-0 → group-hover:opacity-100
- **Disabled**: opacity-50
- **Toast Close Button**: opacity-0 → hover:opacity-100 → focus:opacity-100

### 7.4 Ring/Focus Effects
- **Focus Ring**: ring-2 ring-offset-2
- **Color**: ring-primary-500, ring-gray-400, etc.
- **Selection**: ring-4 ring-offset-2

---

## 8. RESPONSIVE DESIGN PATTERNS

### 8.1 Breakpoints Used
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px

### 8.2 Responsive Patterns
- **Container Padding**: px-4 sm:px-6 lg:px-8
- **Grid Columns**: 
  - grid-cols-1 (mobile)
  - md:grid-cols-2 (tablet)
  - lg:grid-cols-3 (desktop)
- **Flexbox Direction**: flex-col-reverse sm:flex-row
- **Text Sizing**: text-sm → text-base → text-lg at breakpoints
- **Width Constraints**: max-w-md, max-w-lg, max-w-7xl

### 8.3 Mobile-Specific Patterns
- **Touch Targets**: min 44px × 44px
- **Full Width**: w-full buttons and inputs
- **Simplified Layout**: Single column grids
- **Dialog**: max-w-lg for modal content

---

## 9. ACCESSIBILITY PATTERNS

### 9.1 Semantic HTML
- Form fields use proper `<label>` with `htmlFor`
- Buttons are semantic `<button>` elements
- Proper heading hierarchy (h1, h2, h3, h4)

### 9.2 Focus Management
- Focus rings: 2px offset-2
- Focus color: primary-500 or semantic colors
- Outline: none (replaced by ring)

### 9.3 ARIA Attributes
- Aria-label: Used on icon buttons (e.g., "Select color #FFB3BA")
- Title attributes: For emoji and color buttons

### 9.4 Touch Target Sizing
- Standard: 44px × 44px minimum
- Large: 64px × 64px for primary actions
- Icon buttons: h-4 w-4 (inside 44px+ container)

---

## 10. VISUAL HIERARCHY & TYPOGRAPHY

### 10.1 Heading Styles
- **h1** (Page Title): text-3xl/4xl font-bold text-gray-900
- **h2** (Section Title): text-2xl font-bold text-gray-900
- **h3** (Card Title): font-semibold text-lg/xl text-gray-900
- **h4** (Item Title): font-semibold text-gray-900

### 10.2 Body Text
- **Regular**: text-base text-gray-900
- **Secondary**: text-sm text-gray-600
- **Small**: text-xs text-gray-500

### 10.3 Font Weights
- Bold: font-bold (h1, h2)
- Semibold: font-semibold (h3, h4, labels, badges)
- Medium: font-medium (button text, strong emphasis)
- Regular: default (body text)

---

## 11. SPACING & LAYOUT SYSTEM

### 11.1 Common Gaps
- gap-1: 0.25rem (4px)
- gap-2: 0.5rem (8px)
- gap-3: 0.75rem (12px)
- gap-4: 1rem (16px)
- gap-6: 1.5rem (24px)

### 11.2 Padding Standards
- Compact: p-2, p-3
- Standard: p-4
- Large: p-6
- Extra Large: p-8

### 11.3 Margin Standards
- Tight: mb-1, mt-1
- Standard: mb-2, mt-2, mb-4, mt-4
- Large: mb-6, mt-6, mb-8, mt-8

### 11.4 Line Spacing
- Text Clamp: line-clamp-2 (2 lines before ellipsis)
- Truncate: truncate (single line)
- Normal: default line-height

---

## SUMMARY OF MIGRATABLE ELEMENTS

### High-Value Components for Migration
1. **Button** (5 variants, 3 sizes) - Highly reusable
2. **Card** (Base + Header/Title/Content subcomponents) - Foundation pattern
3. **Dialog/Modal** (Complete system with subcomponents) - Complex but valuable
4. **Input** (Text input with focus states) - Essential form element
5. **Label** (Form labels with styling) - Supporting element
6. **Form** (Complete form system with validation display) - Critical feature
7. **Toast** (Notification system with auto-dismiss) - Essential feedback mechanism

### Feature Components Ready for Migration
1. **Avatar System** (Color palette + Emoji picker) - Unique KidTrek feature
2. **Card Patterns** (Person, Routine cards with visual hierarchy)
3. **List Patterns** (Grid layouts with empty states and reordering)
4. **Form Patterns** (Person, Routine, Task forms with previews)
5. **Empty States** (Consistent styling across all lists)

### Layout Patterns for Reference
1. **Dashboard Layout** (Max-width container, padding, heading + content)
2. **Auth Layout** (Centered form container)
3. **Detail Pages** (Back navigation, header card, content section)
4. **Breadcrumb Navigation** (Back buttons with ArrowLeft icon)

### Visual Design Standards
- Color system: Primary blue + 32 pastel colors
- Typography: System fonts with consistent sizing
- Spacing: 4px-based grid system
- Shadows: md (default), lg (hover)
- Border-radius: lg (buttons), xl (cards)
- Transitions: 200-300ms, all properties
- Touch targets: 44px minimum (responsive)

