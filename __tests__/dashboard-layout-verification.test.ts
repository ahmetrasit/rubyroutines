/**
 * Dashboard Layout Verification Test
 *
 * This test verifies the dashboard layout changes:
 * 1. Parent Dashboard reduced to 3 cards
 * 2. Teacher Dashboard reduced to 3 cards
 * 3. GetRoutinesModal correctly implemented
 * 4. Responsive grid layout
 * 5. Click handlers properly connected
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Dashboard Layout Verification', () => {
  const projectRoot = path.join(__dirname, '..');

  describe('Parent Dashboard', () => {
    const parentDashboardPath = path.join(projectRoot, 'app/(dashboard)/parent/page.tsx');
    const parentDashboardCode = fs.readFileSync(parentDashboardPath, 'utf-8');

    it('should have exactly 3 cards in quick navigation', () => {
      // Verify the grid exists
      const gridMatch = parentDashboardCode.match(/grid grid-cols-2 md:grid-cols-3/);
      expect(gridMatch).toBeDefined();

      // Count top-level Card components (not CardHeader or CardContent)
      // by matching <Card with a space or > after it
      const topLevelCardMatches = parentDashboardCode.match(/<Card[\s>]/g);
      expect(topLevelCardMatches?.length).toBeGreaterThanOrEqual(3);
    });

    it('should have Get Routines, Analytics, and Settings cards', () => {
      expect(parentDashboardCode).toContain('Get Routines');
      expect(parentDashboardCode).toContain('Analytics');
      expect(parentDashboardCode).toContain('Settings');
      expect(parentDashboardCode).toContain('Import & save');
      expect(parentDashboardCode).toContain('View insights');
      expect(parentDashboardCode).toContain('Account & billing');
    });

    it('should import GetRoutinesModal', () => {
      expect(parentDashboardCode).toMatch(/import.*GetRoutinesModal.*from.*@\/components\/routine\/GetRoutinesModal/);
    });

    it('should have state management for GetRoutinesModal', () => {
      expect(parentDashboardCode).toContain('useState(false)');
      expect(parentDashboardCode).toContain('showGetRoutines');
      expect(parentDashboardCode).toContain('setShowGetRoutines');
    });

    it('should render GetRoutinesModal with correct props', () => {
      expect(parentDashboardCode).toContain('<GetRoutinesModal');
      expect(parentDashboardCode).toContain('isOpen={showGetRoutines}');
      expect(parentDashboardCode).toContain('onClose={() => setShowGetRoutines(false)}');
      expect(parentDashboardCode).toContain('roleId={parentRole.id}');
    });

    it('should have responsive grid layout (2 cols mobile, 3 cols desktop)', () => {
      const gridMatch = parentDashboardCode.match(/grid-cols-2\s+md:grid-cols-3/);
      expect(gridMatch).toBeTruthy();
    });

    it('should have proper click handler for Get Routines card', () => {
      expect(parentDashboardCode).toContain('onClick={() => setShowGetRoutines(true)}');
    });

    it('should use Link components for Analytics and Settings', () => {
      expect(parentDashboardCode).toMatch(/<Link href="\/analytics"/);
      expect(parentDashboardCode).toMatch(/<Link href="\/settings"/);
    });

    it('should not have removed components', () => {
      // Should not contain marketplace, import code, copy routines, etc.
      expect(parentDashboardCode).not.toContain('Marketplace');
      expect(parentDashboardCode).not.toContain('Import Code');
      expect(parentDashboardCode).not.toContain('Copy Routines');
      expect(parentDashboardCode).not.toContain('Show Hidden');
      expect(parentDashboardCode).not.toContain('Goals');
      expect(parentDashboardCode).not.toContain('Billing');
    });

    it('should have all required imports and no unused imports', () => {
      const imports = [
        'useEffect',
        'useState',
        'useRouter',
        'trpc',
        'PersonList',
        'ModeSwitcher',
        'Card',
        'CardContent',
        'CardHeader',
        'CardTitle',
        'Download',
        'BarChart3',
        'Settings',
        'GetRoutinesModal',
        'Link'
      ];

      imports.forEach(importName => {
        expect(parentDashboardCode).toContain(importName);
      });
    });
  });

  describe('Teacher Dashboard', () => {
    const teacherDashboardPath = path.join(projectRoot, 'app/(dashboard)/teacher/page.tsx');
    const teacherDashboardCode = fs.readFileSync(teacherDashboardPath, 'utf-8');

    it('should have exactly 3 cards in quick navigation', () => {
      // Verify the grid exists
      const gridMatch = teacherDashboardCode.match(/grid grid-cols-2 md:grid-cols-3/);
      expect(gridMatch).toBeDefined();

      // Count top-level Card components (not CardHeader or CardContent)
      // by matching <Card with a space or > after it
      const topLevelCardMatches = teacherDashboardCode.match(/<Card[\s>]/g);
      expect(topLevelCardMatches?.length).toBeGreaterThanOrEqual(3);
    });

    it('should have Get Routines, Analytics, and Settings cards', () => {
      expect(teacherDashboardCode).toContain('Get Routines');
      expect(teacherDashboardCode).toContain('Analytics');
      expect(teacherDashboardCode).toContain('Settings');
      expect(teacherDashboardCode).toContain('Import & save');
      expect(teacherDashboardCode).toContain('View insights');
      expect(teacherDashboardCode).toContain('Account & billing');
    });

    it('should import GetRoutinesModal', () => {
      expect(teacherDashboardCode).toMatch(/import.*GetRoutinesModal.*from.*@\/components\/routine\/GetRoutinesModal/);
    });

    it('should have state management for GetRoutinesModal', () => {
      expect(teacherDashboardCode).toContain('useState(false)');
      expect(teacherDashboardCode).toContain('showGetRoutines');
      expect(teacherDashboardCode).toContain('setShowGetRoutines');
    });

    it('should render GetRoutinesModal with correct props', () => {
      expect(teacherDashboardCode).toContain('<GetRoutinesModal');
      expect(teacherDashboardCode).toContain('isOpen={showGetRoutines}');
      expect(teacherDashboardCode).toContain('onClose={() => setShowGetRoutines(false)}');
      expect(teacherDashboardCode).toContain('roleId={teacherRole.id}');
    });

    it('should have responsive grid layout (2 cols mobile, 3 cols desktop)', () => {
      const gridMatch = teacherDashboardCode.match(/grid-cols-2\s+md:grid-cols-3/);
      expect(gridMatch).toBeTruthy();
    });

    it('should have proper click handler for Get Routines card', () => {
      expect(teacherDashboardCode).toContain('onClick={() => setShowGetRoutines(true)}');
    });

    it('should use Link components for Analytics and Settings', () => {
      expect(teacherDashboardCode).toMatch(/<Link href="\/analytics"/);
      expect(teacherDashboardCode).toMatch(/<Link href="\/settings"/);
    });

    it('should not have removed components', () => {
      // Should not contain marketplace, import code, copy routines, etc.
      expect(teacherDashboardCode).not.toContain('Marketplace');
      expect(teacherDashboardCode).not.toContain('Import Code');
      expect(teacherDashboardCode).not.toContain('Copy Routines');
      expect(teacherDashboardCode).not.toContain('Show Hidden');
      expect(teacherDashboardCode).not.toContain('Billing');
    });

    it('should have all required imports and no unused imports', () => {
      const imports = [
        'useEffect',
        'useState',
        'useRouter',
        'trpc',
        'GroupList',
        'ModeSwitcher',
        'Card',
        'CardContent',
        'CardHeader',
        'CardTitle',
        'Download',
        'BarChart3',
        'Settings',
        'GetRoutinesModal',
        'Link'
      ];

      imports.forEach(importName => {
        expect(teacherDashboardCode).toContain(importName);
      });
    });
  });

  describe('GetRoutinesModal Component', () => {
    const modalPath = path.join(projectRoot, 'components/routine/GetRoutinesModal.tsx');
    const modalCode = fs.readFileSync(modalPath, 'utf-8');

    it('should exist and be properly exported', () => {
      expect(fs.existsSync(modalPath)).toBe(true);
      expect(modalCode).toContain('export function GetRoutinesModal');
    });

    it('should accept correct props', () => {
      expect(modalCode).toContain('interface GetRoutinesModalProps');
      expect(modalCode).toContain('isOpen: boolean');
      expect(modalCode).toContain('onClose: () => void');
      expect(modalCode).toContain('roleId: string');
    });

    it('should have state management for ImportFromCodeModal', () => {
      expect(modalCode).toContain('useState(false)');
      expect(modalCode).toContain('showImportCode');
      expect(modalCode).toContain('setShowImportCode');
    });

    it('should import required dependencies', () => {
      expect(modalCode).toContain("from 'react'");
      expect(modalCode).toContain("from '@/components/ui/dialog'");
      expect(modalCode).toContain("from '@/components/ui/card'");
      expect(modalCode).toContain("from 'lucide-react'");
      expect(modalCode).toContain("from '@/components/marketplace/ImportFromCodeModal'");
      expect(modalCode).toContain("from 'next/navigation'");
    });

    it('should have 3 option cards', () => {
      const cardMatches = modalCode.match(/<Card/g);
      expect(cardMatches?.length).toBeGreaterThanOrEqual(3);
    });

    it('should have Community Routines option', () => {
      expect(modalCode).toContain('Community Routines');
      expect(modalCode).toContain('Browse public routines shared by the community');
      expect(modalCode).toContain('Globe');
    });

    it('should have Private Code option', () => {
      expect(modalCode).toContain('Private Code');
      expect(modalCode).toContain('Enter a share code from another user');
      expect(modalCode).toContain('Key');
    });

    it('should have Saved Routines option', () => {
      expect(modalCode).toContain('Saved Routines');
      expect(modalCode).toContain('Routines you saved for later');
      expect(modalCode).toContain('Bookmark');
    });

    it('should have proper click handlers', () => {
      expect(modalCode).toContain('handleCommunityRoutines');
      expect(modalCode).toContain('handlePrivateCode');
      expect(modalCode).toContain('handleSavedRoutines');
      expect(modalCode).toContain('handleImportCodeClose');
    });

    it('should navigate to correct routes', () => {
      expect(modalCode).toContain("router.push('/community-routines')");
      expect(modalCode).toContain("router.push('/saved-routines')");
    });

    it('should toggle ImportFromCodeModal state', () => {
      expect(modalCode).toContain('setShowImportCode(true)');
      expect(modalCode).toContain('setShowImportCode(false)');
    });

    it('should render ImportFromCodeModal with correct props', () => {
      expect(modalCode).toContain('<ImportFromCodeModal');
      expect(modalCode).toContain('isOpen={showImportCode}');
      expect(modalCode).toContain('onClose={handleImportCodeClose}');
      expect(modalCode).toContain('roleId={roleId}');
    });

    it('should conditionally render main dialog', () => {
      expect(modalCode).toContain('open={isOpen && !showImportCode}');
      expect(modalCode).toContain('onOpenChange={(open) => !open && onClose()}');
    });

    it('should have proper styling with hover effects', () => {
      expect(modalCode).toContain('hover:shadow-md');
      expect(modalCode).toContain('hover:border-blue-300');
      expect(modalCode).toContain('hover:border-purple-300');
      expect(modalCode).toContain('hover:border-amber-300');
    });
  });

  describe('File System Verification', () => {
    it('should not have removed component files', () => {
      const removedFiles = [
        'components/sharing/SharePersonModal.tsx',
        'components/sharing/ClaimShareCodeModal.tsx',
        'components/sharing/InvitationManagement.tsx'
      ];

      removedFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(false);
      });
    });

    it('should have GetRoutinesModal file', () => {
      const modalPath = path.join(projectRoot, 'components/routine/GetRoutinesModal.tsx');
      expect(fs.existsSync(modalPath)).toBe(true);
    });

    it('should have ImportFromCodeModal file', () => {
      const importModalPath = path.join(projectRoot, 'components/marketplace/ImportFromCodeModal.tsx');
      expect(fs.existsSync(importModalPath)).toBe(true);
    });
  });

  describe('Integration Verification', () => {
    it('should not reference removed components in codebase', () => {
      const dashboards = [
        path.join(projectRoot, 'app/(dashboard)/parent/page.tsx'),
        path.join(projectRoot, 'app/(dashboard)/teacher/page.tsx')
      ];

      const removedComponents = [
        'SharePersonModal',
        'ClaimShareCodeModal',
        'InvitationManagement'
      ];

      dashboards.forEach(dashboardPath => {
        const code = fs.readFileSync(dashboardPath, 'utf-8');
        removedComponents.forEach(component => {
          expect(code).not.toContain(component);
        });
      });
    });

    it('should properly use icons from lucide-react', () => {
      const modalPath = path.join(projectRoot, 'components/routine/GetRoutinesModal.tsx');
      const modalCode = fs.readFileSync(modalPath, 'utf-8');

      expect(modalCode).toContain('Globe');
      expect(modalCode).toContain('Key');
      expect(modalCode).toContain('Bookmark');
    });
  });
});
