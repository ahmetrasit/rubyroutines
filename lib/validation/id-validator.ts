import { z } from 'zod';

/**
 * Flexible ID validator that accepts both UUID and CUID formats
 * 
 * This validator is necessary because the database may contain IDs in different formats:
 * - UUID: Standard format with hyphens (e.g., "b971c845-ef8b-4b16-9ec3-921f8c18cb9e")
 * - CUID: Collision-resistant unique identifiers (e.g., "clk3x7z0q0000s5...")
 * - Plain alphanumeric: Other ID formats used by the system
 * 
 * The validator also trims whitespace to handle IDs from URL parameters.
 */
export const idValidator = z.string().min(1).transform((val) => val.trim()).refine(
  (id) => {
    // Accept UUID format (with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Accept CUID format (starts with 'c' followed by alphanumeric)
    const cuidRegex = /^c[a-z0-9]{24,}$/i;
    // Accept plain alphanumeric IDs
    const plainIdRegex = /^[a-z0-9_-]{10,}$/i;

    return uuidRegex.test(id) || cuidRegex.test(id) || plainIdRegex.test(id);
  },
  { message: 'Invalid ID format' }
);
