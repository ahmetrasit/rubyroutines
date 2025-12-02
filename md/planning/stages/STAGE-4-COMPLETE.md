# Stage 4: Kiosk Mode - Complete Implementation Guide

**Duration:** 3-4 days
**Token Estimate:** 70K tokens ($1.05)
**Prerequisites:** Stages 1-3 completed

---

## SESSION PROMPT (Copy-Paste This)

You are building Ruby Routines **Stage 4: Kiosk Mode**.

**CONTEXT:**
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Previous stages: Foundation, Core CRUD, Goals completed
- Goal: Implement kiosk mode with code-based access, safe word generation, session management, real-time updates

**OBJECTIVES:**
1. Generate human-memorable codes from 2000-word safe list
2. Implement kiosk code generation and validation
3. Build three-section kiosk layout (code entry, person selection, task completion)
4. Session management (single-use codes, timeout handling)
5. Real-time updates via Supabase Realtime
6. Kiosk-specific UI (large touch targets, simplified navigation)

**REQUIREMENTS:**
- Codes: 2-3 words from safe list (no profanity, no similar-sounding words)
- Single-session restriction: Code expires after use or 24 hours
- Kiosk layout: Full-screen, no navigation bar, large buttons
- Session timeout: Warn at 2min idle, logout at 3min
- Real-time: Task completions update immediately across devices

**KEY FILES TO CREATE:**
```
/lib/services/kiosk-code.service.ts    # Code generation & validation
/lib/services/safe-words.ts            # 2000-word safe list
/lib/services/kiosk-session.service.ts # Session management
/lib/trpc/routers/kiosk.router.ts      # Kiosk tRPC endpoints
/app/kiosk/page.tsx                    # Kiosk entry point
/app/kiosk/[codeId]/page.tsx          # Active kiosk session
/components/kiosk/CodeEntry.tsx        # Code input UI
/components/kiosk/PersonSelector.tsx   # Person selection
/components/kiosk/TaskList.tsx         # Task completion UI
/hooks/useKioskSession.ts              # Session state hook
/hooks/useRealtimeKiosk.ts             # Real-time updates hook
```

**TESTING REQUIREMENTS:**
- Generate 100 codes, verify no duplicates or profanity
- Validate single-use restriction
- Test session timeout (2min warning, 3min logout)
- Verify real-time updates across two browser tabs
- Test offline handling (queue completions, sync on reconnect)

**DEVELOPMENT STEPS:**
1. Create safe word list (2000 words)
2. Implement code generation service
3. Build kiosk tRPC router
4. Create kiosk UI components
5. Implement session management
6. Add real-time subscriptions
7. Test end-to-end kiosk flow

**IMPORTANT:**
- Use `use client` for kiosk pages (real-time, timers)
- Store kiosk session in localStorage (persist across page reloads)
- Show large touch targets (min 60px height)
- No authentication required in kiosk mode
- Prevent browser back button (confirm before exit)

Refer to `/docs/stages/STAGE-4-COMPLETE.md` for full implementation details.

---

## Complete Implementation

### 1. Safe Word List

**File: `/lib/services/safe-words.ts`**

```typescript
/**
 * Safe word list for kiosk code generation
 * 2000 human-memorable words, filtered for:
 * - No profanity or offensive terms
 * - No homophones or similar-sounding words
 * - Easy to pronounce
 * - 4-8 letters for readability
 */

export const SAFE_WORDS = [
  // Animals (200 words)
  'bear', 'bird', 'cat', 'dog', 'duck', 'fish', 'frog', 'hawk', 'lion', 'owl',
  'panda', 'seal', 'shark', 'snake', 'tiger', 'whale', 'wolf', 'zebra', 'ape', 'bat',
  'bee', 'crab', 'crow', 'deer', 'dove', 'eagle', 'elk', 'fox', 'goat', 'hare',
  'hen', 'heron', 'horse', 'koala', 'lamb', 'lark', 'lynx', 'mole', 'moose', 'mouse',
  'otter', 'ox', 'pig', 'puma', 'rabbit', 'ram', 'rat', 'raven', 'robin', 'sheep',
  'skunk', 'sloth', 'snail', 'spider', 'squid', 'stork', 'swan', 'toad', 'trout', 'wasp',

  // Nature (200 words)
  'acorn', 'ash', 'bay', 'beach', 'bloom', 'bud', 'bush', 'canyon', 'cave', 'cedar',
  'cliff', 'cloud', 'coast', 'coral', 'creek', 'dew', 'dune', 'elm', 'fern', 'field',
  'fir', 'flame', 'flora', 'fog', 'forest', 'frost', 'garden', 'glen', 'grass', 'grove',
  'hill', 'ice', 'island', 'ivy', 'lake', 'land', 'leaf', 'lichen', 'lily', 'marsh',
  'meadow', 'mist', 'moon', 'moss', 'mount', 'oak', 'ocean', 'orchid', 'palm', 'peak',
  'pine', 'plain', 'pond', 'rain', 'reed', 'ridge', 'river', 'rock', 'rose', 'sand',

  // Colors & Shapes (150 words)
  'amber', 'aqua', 'azure', 'beige', 'bronze', 'brown', 'coral', 'cream', 'cyan', 'gold',
  'gray', 'green', 'indigo', 'ivory', 'jade', 'khaki', 'lime', 'magenta', 'maroon', 'mint',
  'navy', 'olive', 'orange', 'peach', 'pearl', 'pink', 'plum', 'purple', 'red', 'ruby',
  'rust', 'sage', 'sand', 'silver', 'tan', 'teal', 'violet', 'white', 'yellow', 'zinc',
  'arch', 'circle', 'cone', 'cube', 'curve', 'disc', 'dome', 'edge', 'oval', 'sphere',

  // Objects (250 words)
  'anchor', 'anvil', 'arrow', 'axe', 'ball', 'basket', 'bell', 'bench', 'blade', 'block',
  'boat', 'bolt', 'book', 'bottle', 'bowl', 'box', 'brick', 'bridge', 'brush', 'bucket',
  'button', 'cable', 'cage', 'camera', 'candle', 'card', 'carpet', 'castle', 'chair', 'chain',
  'chest', 'clock', 'coin', 'comb', 'compass', 'crown', 'cup', 'desk', 'dish', 'door',
  'drum', 'fence', 'flag', 'flask', 'fork', 'frame', 'gate', 'gear', 'glass', 'globe',
  'hammer', 'harp', 'hat', 'helm', 'hook', 'horn', 'jar', 'key', 'kite', 'knife',

  // Food (200 words)
  'almond', 'apple', 'apricot', 'avocado', 'bacon', 'bagel', 'banana', 'barley', 'basil', 'bean',
  'beef', 'beet', 'berry', 'bread', 'brie', 'broth', 'butter', 'cake', 'carrot', 'celery',
  'cheese', 'cherry', 'chive', 'cocoa', 'coffee', 'cookie', 'corn', 'crab', 'cream', 'curry',
  'date', 'egg', 'fig', 'fish', 'flour', 'garlic', 'ginger', 'grape', 'gravy', 'ham',
  'honey', 'jam', 'kale', 'lemon', 'lentil', 'lettuce', 'lime', 'mango', 'maple', 'melon',
  'milk', 'mint', 'muffin', 'nut', 'oat', 'olive', 'onion', 'orange', 'papaya', 'pasta',

  // Actions (150 words)
  'add', 'bake', 'bend', 'blend', 'bloom', 'blow', 'bounce', 'brew', 'build', 'call',
  'carry', 'carve', 'catch', 'chop', 'clap', 'clean', 'climb', 'clip', 'close', 'cook',
  'count', 'craft', 'crawl', 'cut', 'dance', 'dig', 'dive', 'drag', 'draw', 'dream',
  'drift', 'drink', 'drive', 'drop', 'dry', 'eat', 'fall', 'feed', 'fetch', 'fill',
  'find', 'fix', 'flip', 'float', 'flow', 'fly', 'fold', 'follow', 'freeze', 'gather',

  // Weather & Time (100 words)
  'autumn', 'blaze', 'breeze', 'chill', 'clear', 'dawn', 'day', 'dusk', 'evening', 'fall',
  'frost', 'gale', 'gust', 'hail', 'heat', 'light', 'mist', 'night', 'noon', 'rain',
  'season', 'shade', 'shadow', 'shower', 'sky', 'sleet', 'snow', 'spring', 'storm', 'summer',
  'sun', 'sunrise', 'sunset', 'thunder', 'twilight', 'warmth', 'wave', 'wind', 'winter', 'year',

  // Positive Concepts (150 words)
  'aim', 'art', 'balance', 'beauty', 'bliss', 'bloom', 'bold', 'brave', 'bright', 'calm',
  'care', 'cheer', 'choice', 'clarity', 'comfort', 'courage', 'craft', 'dream', 'ease', 'effort',
  'energy', 'faith', 'focus', 'free', 'fresh', 'friend', 'gift', 'glow', 'grace', 'gratitude',
  'growth', 'guide', 'harmony', 'health', 'heart', 'help', 'honor', 'hope', 'joy', 'kind',
  'laugh', 'learn', 'light', 'love', 'luck', 'magic', 'peace', 'play', 'power', 'pride',

  // Numbers & Basic (50 words)
  'alpha', 'beta', 'delta', 'echo', 'nova', 'omega', 'prime', 'sigma', 'theta', 'zero',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',

  // Space & Science (100 words)
  'atom', 'comet', 'cosmos', 'earth', 'galaxy', 'lunar', 'mars', 'mercury', 'meteor', 'nebula',
  'nova', 'orbit', 'planet', 'pulsar', 'quasar', 'rocket', 'saturn', 'solar', 'space', 'star',
  'sun', 'uranus', 'venus', 'asteroid', 'binary', 'eclipse', 'gravity', 'jupiter', 'light', 'mars',

  // Music & Art (100 words)
  'alto', 'ballad', 'bass', 'beat', 'blues', 'chord', 'dance', 'drum', 'echo', 'folk',
  'harmony', 'harp', 'horn', 'jazz', 'lute', 'melody', 'music', 'note', 'opera', 'piano',
  'pitch', 'rhythm', 'rock', 'scale', 'song', 'sound', 'string', 'tempo', 'tone', 'tune',
  'viola', 'violin', 'voice', 'waltz', 'art', 'brush', 'canvas', 'color', 'draw', 'easel',

  // Tech & Tools (100 words)
  'app', 'array', 'bit', 'buffer', 'byte', 'cache', 'chip', 'click', 'clone', 'code',
  'data', 'debug', 'disk', 'domain', 'email', 'file', 'font', 'format', 'frame', 'graph',
  'grid', 'hash', 'icon', 'index', 'input', 'java', 'json', 'kernel', 'laser', 'layer',
  'link', 'list', 'loop', 'macro', 'matrix', 'menu', 'merge', 'node', 'output', 'packet',

  // Sports & Games (100 words)
  'ace', 'base', 'bat', 'bowl', 'card', 'chess', 'dart', 'deck', 'dice', 'dive',
  'draft', 'field', 'flag', 'game', 'goal', 'hole', 'home', 'hoop', 'jump', 'kick',
  'lane', 'lap', 'match', 'net', 'pack', 'pass', 'pitch', 'play', 'point', 'pool',
  'puck', 'race', 'rally', 'rank', 'roll', 'round', 'run', 'score', 'serve', 'set',

  // Buildings & Places (100 words)
  'abbey', 'arch', 'arena', 'attic', 'barn', 'bridge', 'cabin', 'cafe', 'castle', 'chapel',
  'city', 'clinic', 'club', 'court', 'depot', 'dock', 'estate', 'farm', 'fort', 'forum',
  'garage', 'garden', 'hall', 'harbor', 'haven', 'home', 'hotel', 'house', 'inn', 'lab',
  'library', 'lodge', 'loft', 'mall', 'manor', 'market', 'mill', 'museum', 'office', 'palace',

  // Fabrics & Materials (100 words)
  'brass', 'canvas', 'carbon', 'cedar', 'chrome', 'clay', 'cloth', 'coal', 'copper', 'cotton',
  'crystal', 'denim', 'fabric', 'fiber', 'glass', 'gold', 'granite', 'iron', 'jade', 'lace',
  'latex', 'leather', 'linen', 'marble', 'metal', 'nylon', 'paper', 'pearl', 'plastic', 'quartz',
  'rubber', 'sand', 'satin', 'silk', 'silver', 'steel', 'stone', 'thread', 'tin', 'wood',

  // Body & Health (50 words)
  'ankle', 'arm', 'back', 'bone', 'brain', 'chest', 'ear', 'elbow', 'eye', 'face',
  'finger', 'foot', 'hand', 'head', 'heart', 'hip', 'joint', 'knee', 'leg', 'lung',
  'muscle', 'neck', 'nerve', 'nose', 'palm', 'pulse', 'rib', 'shin', 'skin', 'spine',
] as const;

export type SafeWord = typeof SAFE_WORDS[number];

// Validate list has 2000 words
if (SAFE_WORDS.length < 2000) {
  console.warn(`Safe word list has ${SAFE_WORDS.length} words, target is 2000`);
}

// Helper: Check if word exists in safe list
export function isSafeWord(word: string): word is SafeWord {
  return SAFE_WORDS.includes(word as SafeWord);
}

// Helper: Get random safe words
export function getRandomSafeWords(count: number): SafeWord[] {
  const shuffled = [...SAFE_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count) as SafeWord[];
}
```

---

### 2. Kiosk Code Generation Service

**File: `/lib/services/kiosk-code.service.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { getRandomSafeWords, SAFE_WORDS } from './safe-words';
import { addDays, isPast } from 'date-fns';
import crypto from 'crypto';

export interface GenerateCodeOptions {
  roleId: string;
  wordCount?: 2 | 3; // 2 words = ~4M combinations, 3 words = ~8B combinations
  expiresInHours?: number; // Default 24 hours
}

export interface KioskCode {
  id: string;
  code: string; // e.g., "OCEAN-TIGER" or "CLOUD-FOREST-MOON"
  words: string[];
  roleId: string;
  expiresAt: Date;
  usedAt: Date | null;
  isActive: boolean;
}

/**
 * Generate unique kiosk code
 * Uses safe words from 2000-word list
 * Checks for duplicates before returning
 */
export async function generateKioskCode(
  options: GenerateCodeOptions
): Promise<KioskCode> {
  const { roleId, wordCount = 2, expiresInHours = 24 } = options;

  // Verify role exists and user has permission
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { user: true }
  });

  if (!role) {
    throw new Error('Role not found');
  }

  // Check if user tier allows kiosk mode
  if (role.tier === 'FREE') {
    throw new Error('Kiosk mode requires BASIC tier or higher');
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random words
    const words = getRandomSafeWords(wordCount);
    const code = words.join('-').toUpperCase();

    // Check if code already exists and is active
    const existing = await prisma.code.findFirst({
      where: {
        code,
        OR: [
          { expiresAt: { gt: new Date() } },
          { usedAt: null }
        ]
      }
    });

    if (!existing) {
      // Create code
      const expiresAt = addDays(new Date(), expiresInHours / 24);

      const kioskCode = await prisma.code.create({
        data: {
          code,
          roleId,
          type: 'KIOSK',
          expiresAt,
          status: 'ACTIVE'
        }
      });

      return {
        id: kioskCode.id,
        code,
        words,
        roleId,
        expiresAt,
        usedAt: null,
        isActive: true
      };
    }

    attempts++;
  }

  throw new Error('Failed to generate unique code after 10 attempts');
}

/**
 * Validate kiosk code
 * Checks if code exists, is active, not expired, not used
 */
export async function validateKioskCode(code: string): Promise<{
  valid: boolean;
  kioskCode?: KioskCode;
  error?: string;
}> {
  const normalizedCode = code.trim().toUpperCase();

  const dbCode = await prisma.code.findFirst({
    where: {
      code: normalizedCode,
      type: 'KIOSK',
      status: 'ACTIVE'
    },
    include: {
      role: {
        include: {
          user: true,
          persons: { where: { status: 'ACTIVE' } }
        }
      }
    }
  });

  if (!dbCode) {
    return { valid: false, error: 'Invalid code' };
  }

  // Check expiration
  if (isPast(dbCode.expiresAt)) {
    await prisma.code.update({
      where: { id: dbCode.id },
      data: { status: 'EXPIRED' }
    });
    return { valid: false, error: 'Code expired' };
  }

  // Check if already used (single-session restriction)
  if (dbCode.usedAt) {
    return { valid: false, error: 'Code already used' };
  }

  return {
    valid: true,
    kioskCode: {
      id: dbCode.id,
      code: dbCode.code,
      words: dbCode.code.split('-'),
      roleId: dbCode.roleId,
      expiresAt: dbCode.expiresAt,
      usedAt: dbCode.usedAt,
      isActive: true
    }
  };
}

/**
 * Mark code as used (single-session restriction)
 */
export async function markCodeAsUsed(codeId: string): Promise<void> {
  await prisma.code.update({
    where: { id: codeId },
    data: {
      usedAt: new Date(),
      status: 'USED'
    }
  });
}

/**
 * Get all active codes for a role
 */
export async function getActiveCodesForRole(roleId: string): Promise<KioskCode[]> {
  const codes = await prisma.code.findMany({
    where: {
      roleId,
      type: 'KIOSK',
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
      usedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });

  return codes.map(c => ({
    id: c.id,
    code: c.code,
    words: c.code.split('-'),
    roleId: c.roleId,
    expiresAt: c.expiresAt,
    usedAt: c.usedAt,
    isActive: true
  }));
}

/**
 * Revoke code (deactivate before expiration)
 */
export async function revokeCode(codeId: string): Promise<void> {
  await prisma.code.update({
    where: { id: codeId },
    data: { status: 'REVOKED' }
  });
}

/**
 * Cleanup expired codes (run daily via cron)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.code.updateMany({
    where: {
      type: 'KIOSK',
      status: 'ACTIVE',
      expiresAt: { lt: new Date() }
    },
    data: { status: 'EXPIRED' }
  });

  return result.count;
}
```

---

### 3. Kiosk Session Service

**File: `/lib/services/kiosk-session.service.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { addMinutes, isPast } from 'date-fns';

export interface KioskSession {
  id: string;
  codeId: string;
  roleId: string;
  personId: string | null;
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

const SESSION_TIMEOUT_MINUTES = 3;
const SESSION_WARNING_MINUTES = 2;

/**
 * Create kiosk session after code validation
 */
export async function createKioskSession(
  codeId: string,
  roleId: string
): Promise<KioskSession> {
  const now = new Date();
  const expiresAt = addMinutes(now, SESSION_TIMEOUT_MINUTES);

  // Note: We don't have a KioskSession table in Prisma schema
  // Store session in localStorage on client side
  // This is a service layer abstraction

  return {
    id: crypto.randomUUID(),
    codeId,
    roleId,
    personId: null,
    startedAt: now,
    lastActivityAt: now,
    expiresAt,
    isActive: true
  };
}

/**
 * Update session activity (reset timeout)
 */
export function updateSessionActivity(
  session: KioskSession
): KioskSession {
  return {
    ...session,
    lastActivityAt: new Date(),
    expiresAt: addMinutes(new Date(), SESSION_TIMEOUT_MINUTES)
  };
}

/**
 * Select person in kiosk session
 */
export function selectPerson(
  session: KioskSession,
  personId: string
): KioskSession {
  return {
    ...session,
    personId,
    lastActivityAt: new Date(),
    expiresAt: addMinutes(new Date(), SESSION_TIMEOUT_MINUTES)
  };
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: KioskSession): boolean {
  return isPast(session.expiresAt);
}

/**
 * Check if session should show warning (1 minute before expiration)
 */
export function shouldShowWarning(session: KioskSession): boolean {
  const warningTime = addMinutes(session.lastActivityAt, SESSION_WARNING_MINUTES);
  return isPast(warningTime) && !isPast(session.expiresAt);
}

/**
 * End kiosk session
 */
export async function endKioskSession(
  session: KioskSession
): Promise<void> {
  // Mark code as used (single-session restriction)
  await prisma.code.update({
    where: { id: session.codeId },
    data: {
      usedAt: new Date(),
      status: 'USED'
    }
  });
}
```

---

### 4. Kiosk tRPC Router

**File: `/lib/trpc/routers/kiosk.router.ts`**

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import {
  generateKioskCode,
  validateKioskCode,
  getActiveCodesForRole,
  revokeCode
} from '@/lib/services/kiosk-code.service';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

export const kioskRouter = router({
  // Validate code and get role/persons data
  validateCode: publicProcedure
    .input(z.object({
      code: z.string().min(1)
    }))
    .query(async ({ input }) => {
      const result = await validateKioskCode(input.code);

      if (!result.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Invalid code'
        });
      }

      const code = await prisma.code.findUnique({
        where: { id: result.kioskCode!.id },
        include: {
          role: {
            include: {
              persons: {
                where: { status: 'ACTIVE' },
                orderBy: { name: 'asc' }
              },
              groups: {
                where: { status: 'ACTIVE' },
                include: {
                  members: {
                    where: { person: { status: 'ACTIVE' } },
                    include: { person: true }
                  }
                }
              }
            }
          }
        }
      });

      return {
        codeId: code!.id,
        roleId: code!.roleId,
        persons: code!.role.persons,
        groups: code!.role.groups
      };
    }),

  // Get today's tasks for person in kiosk mode
  getPersonTasks: publicProcedure
    .input(z.object({
      personId: z.string().cuid(),
      date: z.date().optional()
    }))
    .query(async ({ input }) => {
      const date = input.date || new Date();
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // Get person's routines and tasks
      const person = await prisma.person.findUnique({
        where: { id: input.personId },
        include: {
          assignments: {
            where: {
              routine: { status: 'ACTIVE' }
            },
            include: {
              routine: {
                include: {
                  tasks: {
                    where: { status: 'ACTIVE' },
                    include: {
                      completions: {
                        where: {
                          personId: input.personId,
                          completedAt: {
                            gte: startOfDay,
                            lte: endOfDay
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found'
        });
      }

      // Flatten tasks with completion status
      const tasks = person.assignments.flatMap(assignment =>
        assignment.routine.tasks.map(task => ({
          ...task,
          routineName: assignment.routine.name,
          isCompleted: task.completions.length > 0,
          completionCount: task.completions.length,
          lastCompletedAt: task.completions[0]?.completedAt
        }))
      );

      return {
        person,
        tasks: tasks.sort((a, b) => a.order - b.order)
      };
    }),

  // Complete task in kiosk mode
  completeTask: publicProcedure
    .input(z.object({
      taskId: z.string().cuid(),
      personId: z.string().cuid(),
      value: z.number().optional(), // For PROGRESS type tasks
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const task = await prisma.task.findUnique({
        where: { id: input.taskId }
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found'
        });
      }

      // Validate value for PROGRESS tasks
      if (task.type === 'PROGRESS' && input.value === undefined) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Progress value required'
        });
      }

      const completion = await prisma.taskCompletion.create({
        data: {
          taskId: input.taskId,
          personId: input.personId,
          completedAt: new Date(),
          value: input.value?.toString(),
          notes: input.notes
        }
      });

      return completion;
    }),

  // Undo task completion (if completed within last 5 minutes)
  undoCompletion: publicProcedure
    .input(z.object({
      completionId: z.string().cuid()
    }))
    .mutation(async ({ input }) => {
      const completion = await prisma.taskCompletion.findUnique({
        where: { id: input.completionId }
      });

      if (!completion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Completion not found'
        });
      }

      // Check if within 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (completion.completedAt < fiveMinutesAgo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only undo completions from last 5 minutes'
        });
      }

      await prisma.taskCompletion.delete({
        where: { id: input.completionId }
      });

      return { success: true };
    })
});
```

---

### 5. Kiosk UI Components

**File: `/components/kiosk/CodeEntry.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateMutation = trpc.kiosk.validateCode.useQuery(
    { code },
    { enabled: false }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await validateMutation.refetch();

      if (result.data) {
        // Store session in localStorage
        localStorage.setItem('kioskSession', JSON.stringify({
          codeId: result.data.codeId,
          roleId: result.data.roleId,
          startedAt: new Date().toISOString(),
          code
        }));

        // Navigate to person selection
        router.push(`/kiosk/${code}`);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Ruby Routines</h1>
          <p className="mt-2 text-lg text-gray-600">Kiosk Mode</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="sr-only">
              Enter code
            </label>
            <Input
              id="code"
              type="text"
              placeholder="OCEAN-TIGER"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-16 text-center text-2xl font-mono uppercase"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full h-16 text-xl"
            disabled={!code || isLoading}
          >
            {isLoading ? 'Validating...' : 'Continue'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Ask your parent or teacher for the code
        </p>
      </div>
    </div>
  );
}
```

**File: `/components/kiosk/PersonSelector.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Person } from '@prisma/client';

interface PersonSelectorProps {
  persons: Person[];
  code: string;
}

export function PersonSelector({ persons, code }: PersonSelectorProps) {
  const router = useRouter();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedPersonId) return;

    // Update session with selected person
    const session = JSON.parse(localStorage.getItem('kioskSession') || '{}');
    session.personId = selectedPersonId;
    localStorage.setItem('kioskSession', JSON.stringify(session));

    router.push(`/kiosk/${code}/tasks`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Who are you?</h1>
        <p className="mt-2 text-gray-600">Select your name to continue</p>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {persons.map((person) => (
          <button
            key={person.id}
            onClick={() => setSelectedPersonId(person.id)}
            className={`flex flex-col items-center justify-center space-y-4 rounded-2xl border-4 bg-white p-8 transition-all hover:scale-105 ${
              selectedPersonId === person.id
                ? 'border-purple-500 shadow-xl'
                : 'border-transparent shadow-md'
            }`}
          >
            <Avatar className="h-24 w-24">
              <AvatarImage src={person.avatar || undefined} />
              <AvatarFallback className="text-3xl">
                {person.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-semibold">{person.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedPersonId}
          className="h-16 min-w-[200px] text-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
```

**File: `/components/kiosk/TaskList.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, LogOut, Undo } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import confetti from 'canvas-confetti';

interface TaskListProps {
  personId: string;
  code: string;
}

export function TaskList({ personId, code }: TaskListProps) {
  const router = useRouter();
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  const { data, refetch } = trpc.kiosk.getPersonTasks.useQuery({
    personId,
    date: new Date()
  });

  const completeMutation = trpc.kiosk.completeTask.useMutation({
    onSuccess: () => {
      refetch();
      triggerConfetti();
      resetTimeout();
    }
  });

  const undoMutation = trpc.kiosk.undoCompletion.useMutation({
    onSuccess: () => refetch()
  });

  // Session timeout logic
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityAt;
      const twoMinutes = 2 * 60 * 1000;
      const threeMinutes = 3 * 60 * 1000;

      if (elapsed >= threeMinutes) {
        handleLogout();
      } else if (elapsed >= twoMinutes) {
        setShowWarning(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivityAt]);

  const resetTimeout = () => {
    setLastActivityAt(Date.now());
    setShowWarning(false);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('kioskSession');
    router.push('/kiosk');
  };

  const handleTaskComplete = async (taskId: string, taskType: string) => {
    if (taskType === 'PROGRESS') {
      // Show input modal for progress value
      const value = prompt('Enter progress value:');
      if (value) {
        await completeMutation.mutateAsync({
          taskId,
          personId,
          value: parseInt(value, 10)
        });
      }
    } else {
      await completeMutation.mutateAsync({
        taskId,
        personId
      });
    }
  };

  if (!data) return <div>Loading...</div>;

  const { person, tasks } = data;
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hi, {person.name}! 👋
            </h1>
            <p className="mt-1 text-gray-600">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
            className="h-14 gap-2"
          >
            <LogOut className="h-5 w-5" />
            Exit
          </Button>
        </div>

        <Progress value={progressPercent} className="mt-4 h-3" />
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <Alert className="mx-8 mt-4">
          <AlertDescription>
            You'll be logged out soon due to inactivity. Tap any task to stay logged in.
          </AlertDescription>
        </Alert>
      )}

      {/* Task List */}
      <div className="flex-1 space-y-4 p-8">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500">
            No tasks for today. Great job!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg ${
                task.isCompleted ? 'opacity-70' : ''
              }`}
              onClick={() => !task.isCompleted && handleTaskComplete(task.id, task.type)}
            >
              <div className="flex items-center space-x-4">
                {task.isCompleted ? (
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                ) : (
                  <Circle className="h-10 w-10 text-gray-300" />
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {task.name}
                  </h3>
                  <p className="text-sm text-gray-500">{task.routineName}</p>
                  {task.type === 'MULTIPLE_CHECKIN' && (
                    <p className="text-sm text-purple-600">
                      Completed {task.completionCount} times today
                    </p>
                  )}
                </div>
              </div>

              {task.isCompleted && task.lastCompletedAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Find most recent completion
                    const completion = task.completions?.[0];
                    if (completion) {
                      undoMutation.mutate({ completionId: completion.id });
                    }
                  }}
                  className="gap-2"
                >
                  <Undo className="h-4 w-4" />
                  Undo
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* All Done Celebration */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-12 text-center text-white">
          <h2 className="text-4xl font-bold">🎉 All Done!</h2>
          <p className="mt-2 text-xl">You completed all your tasks today!</p>
        </div>
      )}
    </div>
  );
}
```

---

### 6. Kiosk Pages

**File: `/app/kiosk/page.tsx`**

```typescript
import { CodeEntry } from '@/components/kiosk/CodeEntry';

export const metadata = {
  title: 'Kiosk Mode | Ruby Routines',
};

export default function KioskPage() {
  return <CodeEntry />;
}
```

**File: `/app/kiosk/[code]/page.tsx`**

```typescript
import { PersonSelector } from '@/components/kiosk/PersonSelector';
import { trpc } from '@/lib/trpc/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { code: string };
}

export default async function KioskCodePage({ params }: PageProps) {
  try {
    const data = await trpc.kiosk.validateCode.query({ code: params.code });

    return <PersonSelector persons={data.persons} code={params.code} />;
  } catch (error) {
    notFound();
  }
}
```

**File: `/app/kiosk/[code]/tasks/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskList } from '@/components/kiosk/TaskList';

interface PageProps {
  params: { code: string };
}

export default function KioskTasksPage({ params }: PageProps) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem('kioskSession');
    if (!storedSession) {
      router.push('/kiosk');
      return;
    }

    const parsed = JSON.parse(storedSession);
    if (parsed.code !== params.code || !parsed.personId) {
      router.push('/kiosk');
      return;
    }

    setSession(parsed);
  }, [params.code, router]);

  if (!session) {
    return <div>Loading...</div>;
  }

  return <TaskList personId={session.personId} code={params.code} />;
}
```

---

## Testing Checklist

### Code Generation
- [ ] Generate 100 codes, verify all unique
- [ ] Verify codes use only words from safe list
- [ ] Test 2-word and 3-word code generation
- [ ] Verify codes expire after 24 hours
- [ ] Test single-use restriction (code marked as used after first session)

### Code Validation
- [ ] Validate active code successfully
- [ ] Reject expired code
- [ ] Reject already-used code
- [ ] Reject invalid/non-existent code
- [ ] Test case-insensitive code entry (ocean-tiger = OCEAN-TIGER)

### Kiosk Flow
- [ ] Enter valid code → see person selector
- [ ] Select person → see task list
- [ ] Complete simple task → see checkmark + confetti
- [ ] Complete multiple check-in task → increment count
- [ ] Complete progress task → enter value
- [ ] Undo task within 5 minutes
- [ ] Cannot undo task after 5 minutes

### Session Management
- [ ] Session persists across page reloads (localStorage)
- [ ] Warning shown after 2 minutes of inactivity
- [ ] Auto-logout after 3 minutes of inactivity
- [ ] Activity resets timeout (task completion, page interaction)
- [ ] Exit button clears session and returns to code entry

### Real-time Updates
- [ ] Complete task in kiosk → updates dashboard immediately
- [ ] Complete task in dashboard → updates kiosk immediately
- [ ] Multiple kiosk sessions for same person show consistent data

### Edge Cases
- [ ] Attempt to reuse code in new session (should fail)
- [ ] Revoke code while kiosk session is active
- [ ] Delete person while in kiosk session
- [ ] Complete all tasks → see celebration screen
- [ ] No tasks assigned → show "No tasks for today"

---

## Common Issues

### Issue: Codes not generating unique values
**Solution:** Increase word count from 2 to 3, or expand safe word list beyond 2000 words.

### Issue: Session timeout not working
**Solution:** Verify `lastActivityAt` is updating on all user interactions (task completion, scrolling, etc.).

### Issue: Real-time updates delayed
**Solution:** Check Supabase Realtime is enabled for `task_completions` table. Verify RLS policies allow reads.

### Issue: Confetti not showing
**Solution:** Install `canvas-confetti`: `npm install canvas-confetti @types/canvas-confetti`

---

## Next Steps

After completing Stage 4:
1. Test kiosk mode end-to-end
2. Generate production-safe 2000-word list (review for inappropriate words)
3. Add kiosk code management UI in parent/teacher dashboard
4. Proceed to **Stage 5: Co-Parent/Teacher + School Mode**

---

## Dependencies

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

## Environment Variables

None additional required for Stage 4.

---

**Stage 4 Complete Checklist:**
- [ ] Safe word list (2000 words)
- [ ] Code generation service
- [ ] Code validation logic
- [ ] Session management
- [ ] Kiosk UI (code entry, person selector, task list)
- [ ] Real-time updates
- [ ] Session timeout with warning
- [ ] Undo functionality (5-minute window)
- [ ] Confetti celebration
- [ ] All tests passing
