# Screenshot Instructions

This document provides instructions for capturing screenshots of all 6 check-in UI designs.

## Prerequisites
- Development server running (`npm run dev`)
- Browser with viewport adjustment capability (Chrome DevTools recommended)
- Screenshot tool or browser screenshot extension

## Screenshot Specifications

### Dashboard Designs (Smartphone)
- **Viewport Size:** 375px × 812px (iPhone 12/13 size)
- **Format:** PNG
- **Quality:** High resolution (2x or 3x for retina)

### Kiosk Designs (Tablet)
- **Viewport Size:** 768px × 1024px (iPad size)
- **Format:** PNG
- **Quality:** High resolution (2x)

## Step-by-Step Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Preview Page
Open: `http://localhost:3000/checkin-preview`

### 3. Capture Dashboard Screenshots

#### Dashboard Design 1: Card-based Swipeable
1. Click "Preview Design 1" button
2. Set browser viewport to 375px × 812px
3. Capture these states:
   - **Initial state** with first task visible
   - **Celebration animation** (capture during confetti)
   - **All done state** (after completing all tasks)
4. Save as:
   - `screenshots/dashboard-1-initial.png`
   - `screenshots/dashboard-1-celebration.png`
   - `screenshots/dashboard-1-complete.png`

#### Dashboard Design 2: Compact List
1. Click "Preview Design 2" button
2. Set browser viewport to 375px × 812px
3. Capture these states:
   - **Initial state** with all tasks listed
   - **Progress task expanded** (tap a progress task to expand input)
   - **Completed state** with some tasks done
4. Save as:
   - `screenshots/dashboard-2-initial.png`
   - `screenshots/dashboard-2-expanded.png`
   - `screenshots/dashboard-2-partial.png`

#### Dashboard Design 3: Gamified
1. Click "Preview Design 3" button
2. Set browser viewport to 375px × 812px
3. Capture these states:
   - **Initial state** showing level and XP bar
   - **Task card** with gamified elements
   - **Victory screen** after all tasks complete
4. Save as:
   - `screenshots/dashboard-3-initial.png`
   - `screenshots/dashboard-3-task.png`
   - `screenshots/dashboard-3-victory.png`

### 4. Capture Kiosk Screenshots

#### Kiosk Design 1: Grid-based Tiles
1. Click "Preview Kiosk 1" button
2. Set browser viewport to 768px × 1024px
3. Capture these states:
   - **Grid view** with all tasks visible
   - **Celebration overlay** (capture during animation)
   - **Completed section** showing done tasks
4. Save as:
   - `screenshots/kiosk-1-grid.png`
   - `screenshots/kiosk-1-celebration.png`
   - `screenshots/kiosk-1-completed.png`

#### Kiosk Design 2: Split-screen
1. Click "Preview Kiosk 2" button
2. Set browser viewport to 768px × 1024px
3. Capture these states:
   - **Split view** showing goals on left, tasks on right
   - **Task selected** with progress input visible
   - **Goal achieved** state
4. Save as:
   - `screenshots/kiosk-2-split.png`
   - `screenshots/kiosk-2-task-selected.png`
   - `screenshots/kiosk-2-goal-achieved.png`

#### Kiosk Design 3: Timeline Flow
1. Click "Preview Kiosk 3" button
2. Set browser viewport to 768px × 1024px
3. Capture these states:
   - **Timeline view** showing vertical progression
   - **Current task** highlighted in timeline
   - **Milestone celebration** (every 3 tasks)
   - **Journey complete** victory screen
4. Save as:
   - `screenshots/kiosk-3-timeline.png`
   - `screenshots/kiosk-3-current.png`
   - `screenshots/kiosk-3-milestone.png`
   - `screenshots/kiosk-3-complete.png`

## Using Chrome DevTools for Screenshots

### Method 1: Device Toolbar
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Click "Toggle Device Toolbar" (Cmd+Shift+M)
3. Select device or enter custom dimensions
4. Use "Capture screenshot" from DevTools menu (⋮)

### Method 2: Full Page Screenshot
1. Open Chrome DevTools
2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
3. Type "screenshot"
4. Choose "Capture full size screenshot"

### Method 3: Node Screenshot
1. Right-click on the element in DevTools
2. Choose "Capture node screenshot"

## Automated Screenshot Script (Optional)

You can use Playwright or Puppeteer to automate screenshot capture:

```javascript
// screenshot-generator.js
const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch();

  // Dashboard screenshots
  const mobilePage = await browser.newPage({
    viewport: { width: 375, height: 812 }
  });

  await mobilePage.goto('http://localhost:3000/checkin-preview');

  // Dashboard Design 1
  await mobilePage.click('button:has-text("Preview Design 1")');
  await mobilePage.screenshot({
    path: 'components/checkin-designs/screenshots/dashboard-1-initial.png'
  });

  // Repeat for other designs...

  await browser.close();
}

captureScreenshots();
```

## Post-Capture Tasks

After capturing all screenshots:

1. **Optimize images:**
   ```bash
   # Install imagemagick if needed
   brew install imagemagick

   # Optimize all PNGs
   mogrify -strip -quality 85 components/checkin-designs/screenshots/*.png
   ```

2. **Update README:**
   Add screenshot references to the main README.md

3. **Commit and push:**
   ```bash
   git add components/checkin-designs/screenshots/
   git commit -m "docs: add screenshots for all 6 check-in UI designs"
   git push
   ```

## Screenshot Checklist

### Dashboard (Smartphone - 375×812)
- [ ] dashboard-1-initial.png
- [ ] dashboard-1-celebration.png
- [ ] dashboard-1-complete.png
- [ ] dashboard-2-initial.png
- [ ] dashboard-2-expanded.png
- [ ] dashboard-2-partial.png
- [ ] dashboard-3-initial.png
- [ ] dashboard-3-task.png
- [ ] dashboard-3-victory.png

### Kiosk (Tablet - 768×1024)
- [ ] kiosk-1-grid.png
- [ ] kiosk-1-celebration.png
- [ ] kiosk-1-completed.png
- [ ] kiosk-2-split.png
- [ ] kiosk-2-task-selected.png
- [ ] kiosk-2-goal-achieved.png
- [ ] kiosk-3-timeline.png
- [ ] kiosk-3-current.png
- [ ] kiosk-3-milestone.png
- [ ] kiosk-3-complete.png

**Total:** 19 screenshots

## Alternative: Request Screenshots

If you'd like someone else to generate screenshots, share this document with them along with access to the repository.
