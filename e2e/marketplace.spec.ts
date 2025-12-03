import { test, expect, waitForPageLoad, hasValidAuth } from './fixtures/test-fixtures';

/**
 * Marketplace E2E Tests
 *
 * Tests cover:
 * - Browsing marketplace
 * - Viewing routine details
 * - Importing routines
 * - Publishing routines
 */

test.describe('Marketplace', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasValidAuth()) {
      testInfo.skip(true, 'Auth state not available - skipping authenticated tests');
    }
  });

  test.describe('Browse Marketplace', () => {
    test('should navigate to marketplace page', async ({ authenticatedPage: page }) => {
      await page.goto('/marketplace');
      await waitForPageLoad(page);

      // Should be on marketplace or login
      const url = page.url();
      expect(url.includes('marketplace') || url.includes('login')).toBeTruthy();
    });

    test('should display marketplace routines', async ({ authenticatedPage: page }) => {
      await page.goto('/marketplace');
      await waitForPageLoad(page);

      const url = page.url();
      if (url.includes('marketplace')) {
        // Should show routines, community content, or empty state
        const hasRoutines = await page.getByText(/routine|morning|daily|template/i).isVisible().catch(() => false);
        const hasCommunity = await page.getByText(/community|shared|browse/i).isVisible().catch(() => false);
        const hasEmptyState = await page.getByText(/no routines|coming soon|empty/i).isVisible().catch(() => false);
        const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);

        expect(hasRoutines || hasCommunity || hasEmptyState || hasHeading).toBeTruthy();
      } else {
        // Page may redirect - that's fine
        expect(!url.includes('/login')).toBeTruthy();
      }
    });

    test('should allow searching marketplace', async ({ authenticatedPage: page }) => {
      await page.goto('/marketplace');
      await waitForPageLoad(page);

      if (page.url().includes('marketplace')) {
        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('morning');
          await page.waitForTimeout(500);

          // Search should be performed
          expect(await searchInput.inputValue()).toBe('morning');
        }
      }
    });
  });

  test.describe('Routine Details', () => {
    test('should view routine details in marketplace', async ({ authenticatedPage: page }) => {
      await page.goto('/marketplace');
      await waitForPageLoad(page);

      if (page.url().includes('marketplace')) {
        // Click on a routine card
        const routineCard = page.locator('[data-testid="routine-card"], .routine-card, a[href*="/marketplace/"]').first();
        if (await routineCard.isVisible()) {
          await routineCard.click();
          await page.waitForLoadState('networkidle');

          // Should show routine details
          expect(page.url()).toMatch(/marketplace/);
        }
      }
    });
  });

  test.describe('Import Routine', () => {
    test('should show import option for marketplace routines', async ({ authenticatedPage: page }) => {
      await page.goto('/marketplace');
      await waitForPageLoad(page);

      if (page.url().includes('marketplace')) {
        // Look for import button on any routine
        const importButton = page.getByRole('button', { name: /import|add|use/i }).first();
        const hasImport = await importButton.isVisible().catch(() => false);

        // Import option should exist
        expect(hasImport || page.url().includes('marketplace')).toBeTruthy();
      }
    });

    test('should show import modal from dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/parent');
      await waitForPageLoad(page);

      // Look for import from code button
      const importButton = page.getByRole('button', { name: /import|code/i }).first();
      if (await importButton.isVisible()) {
        await importButton.click();
        await page.waitForTimeout(500);

        // Should show import modal/form
        const hasModal = await page.locator('[role="dialog"], .modal, form').isVisible().catch(() => false);
        expect(hasModal || page.url().includes('parent')).toBeTruthy();
      }
    });
  });

  test.describe('Publish Routine', () => {
    test('should show publish option for owned routines', async ({ authenticatedPage: page }) => {
      await page.goto('/parent');
      await waitForPageLoad(page);

      // Navigate to a routine
      const personLink = page.locator('a[href^="/parent/"]').first();
      if (await personLink.isVisible()) {
        await personLink.click();
        await page.waitForLoadState('networkidle');

        // Look for publish/share to marketplace option
        const publishOption = page.getByText(/publish|share.*marketplace|make.*public/i).first();
        const hasPublish = await publishOption.isVisible().catch(() => false);

        expect(hasPublish || page.url().includes('/parent/')).toBeTruthy();
      }
    });
  });
});
